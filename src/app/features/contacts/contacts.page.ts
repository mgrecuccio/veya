import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { IonicModule, ActionSheetController, AlertController } from '@ionic/angular';
import { ContactsPageData, ContactsPageDataService } from "./data/contacts-page-data.service";
import { catchError, map, Observable, of, shareReplay, startWith, Subject, switchMap } from "rxjs";

type ContactsPageVmState =
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'success'; data: ContactsPageVm };

interface ContactsPageVm {
  contacts: ContactCardVm[];
  pendingInvitations: PendingInvitationCardVm[];
  showFullyEmptyState: boolean;
}

interface ContactCardVm {
  id: number;
  displayLabel: string;
  nickName: string | null;
  initials: string;
  favorite: boolean;
  createdAt: string | null;
  createdLabel: string;
}

interface PendingInvitationCardVm {
  id: number;
  senderUserId: number | null;
  displayLabel: string;
  nickName: string | null;
  initials: string;
  createdAt: string | null;
  createdLabel: string;
}

@Component({
    selector: 'app-contacts',
    standalone: true,
    imports: [
        CommonModule,
        IonicModule,
        ReactiveFormsModule,
    ],
    templateUrl: './contacts.page.html',
    styleUrls: ['./contacts.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsPage {
  
    private readonly fb = inject(FormBuilder);
    private readonly contactsDataService = inject(ContactsPageDataService);
    private readonly actionSheetController = inject(ActionSheetController);
    private readonly alertController = inject(AlertController);
    private readonly reload$ = new Subject<void>();

    readonly inviteExpanded = signal(false);
    readonly inviteSubmitting = signal(false);
    readonly rowActionBusyId = signal<number | null>(null);
    readonly toastState = signal<{
      isOpen: boolean;
      message: string;
      color: 'success' | 'danger';
    }>({
      isOpen: false,
      message: '',
      color: 'success',
    });

    readonly inviteForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        nickName:['', [Validators.maxLength(100)]],
    });

    readonly vmState$: Observable<ContactsPageVmState> = this.reload$.pipe(
      startWith(void 0),
      switchMap(() =>
        this.contactsDataService.getPageData().pipe(
          map((data): ContactsPageVmState => ({
            kind: 'success',
            data: this.mapToVm(data),
          })),
          startWith<ContactsPageVmState>({ kind: 'loading' }),
          catchError((error: Error) =>
            of<ContactsPageVmState>({
              kind: 'error',
              message:
                error.message ||
                'We couldn’t load your circle right now. Please try again.',
            }),
          ),
        ),
      ),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    openInvite(): void {
      this.inviteExpanded.set(true);
    }

    closeInvite(): void {
      this.inviteExpanded.set(false);
      this.inviteForm.reset({
          email: '',
          nickName: '',
      });
    }

    async submitInvite(): Promise<void> {
      if (this.inviteForm.invalid || this.inviteSubmitting()) {
          this.inviteForm.markAllAsTouched();
          return;
      }

      this.inviteSubmitting.set(true);
      const raw = this.inviteForm.getRawValue();

      this.contactsDataService.sendInvitation({
          email: raw.email.trim(),
          nickName: raw.nickName.trim() || undefined,
      }).subscribe({
        next: () => {
          this.inviteSubmitting.set(false);
          this.closeInvite();
          this.retry();
          this.showToast('Invitation sent.', 'success');
        },
        error: (error: any) => {
          this.inviteSubmitting.set(false);
          this.showToast(
            error?.error?.detail || 'We couldn’t send that invitation right now.',
            'danger',
          );
        }
      });
    }

    acceptInvitation(invitation: PendingInvitationCardVm): void {
      if (this.rowActionBusyId() !== null) {
        return;
      }

      this.rowActionBusyId.set(invitation.id);

      this.contactsDataService.acceptInvitation(invitation.id).subscribe({
        next: async () => {
          this.rowActionBusyId.set(null);
          this.retry();
          this.showToast('Invitation accepted', 'success');
          await this.promptToEditAcceptedContact(invitation);
        },
        error: (error: Error) => {
          this.rowActionBusyId.set(null);
          this.showToast(
            error.message || 'We couldn’t accept that invitation right now.',
            'danger',
          );
        },
      });
    }

    async openContactActions(contact: ContactCardVm): Promise<void> {
      const sheet = await this.actionSheetController.create({
        header: contact.displayLabel,
        cssClass: 'veya-action-sheet',
        buttons: [
          {
            text: 'Edit nickname',
            handler: () => this.openEditContactNickname(contact),
          },
          {
            text: 'Remove contact',
            role: 'destructive',
            handler: () => this.removeContact(contact),
          },
          {
            text: 'Block contact',
            role: 'destructive',
            handler: () => this.blockContact(contact),
          },
          {
            text: 'Cancel',
            role: 'cancel',
          },
        ]
      });

      await sheet.present();
    }

    private removeContact(contact: ContactCardVm): void {
      if (this.rowActionBusyId() !== null) {
        return;
      }

      this.rowActionBusyId.set(contact.id);

      this.contactsDataService.removeContact(contact.id).subscribe({
        next: () => {
          this.rowActionBusyId.set(null);
          this.retry();
          this.showToast('Contact removed.', 'success');
        },
        error: (error: Error) => {
          this.rowActionBusyId.set(null);
          this.showToast(
            error.message || 'We couldn’t remove that contact right now.',
            'danger',
          );
        },
      });
    }

  private blockContact(contact: ContactCardVm): void {
      if (this.rowActionBusyId() !== null) {
        return;
      }

      this.rowActionBusyId.set(contact.id);

      this.contactsDataService.blockContact(contact.id).subscribe({
        next: () => {
          this.rowActionBusyId.set(null);
          this.retry();
          this.showToast('Contact blocked.', 'success');
        },
        error: (error: Error) => {
          this.rowActionBusyId.set(null);
          this.showToast(
            error.message || 'We couldn’t block that contact right now.',
            'danger',
          );
        },
    });
  }

  private async promptToEditAcceptedContact(invitation: PendingInvitationCardVm): Promise<void> {
    if (invitation.senderUserId == null) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Name this contact',
      message: `How would you like ${invitation.displayLabel} to appear in your circle?`,
      inputs: [
        {
          name: 'nickName',
          type: 'text',
          placeholder: 'Add a nickname',
          value: invitation.nickName ?? '',
          attributes: {
            maxlength: 100,
          },
        },
      ],
      buttons: [
        {
          text: 'Skip',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: (data) => {
            const nickName = data?.nickName?.trim();

            if (!nickName) {
              return;
            }

            this.updateContactNickname(invitation.senderUserId!, nickName);
          },
        },
      ],
    });

    await alert.present();
  }

  private async openEditContactNickname(contact: ContactCardVm): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Edit nickname',
      message: `Update how ${contact.displayLabel} appears in your circle.`,
      inputs: [
        {
          name: 'nickName',
          type: 'text',
          placeholder: 'Add a nickname',
          value: contact.nickName ?? '',
          attributes: {
            maxlength: 100,
          },
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: (data) => {
            const nickName = data?.nickName?.trim();

            if (!nickName || nickName === contact.nickName) {
              return;
            }

            this.updateContactNickname(contact.id, nickName);
          },
        },
      ],
    });

    await alert.present();
  }

  private updateContactNickname(contactUserId: number, nickName: string): void {
    this.rowActionBusyId.set(contactUserId);

    this.contactsDataService.editContact(contactUserId, { nickName }).subscribe({
      next: () => {
        this.rowActionBusyId.set(null);
        this.retry();
        this.showToast('Contact nickname updated.', 'success');
      },
      error: (error: any) => {
        this.rowActionBusyId.set(null);
        this.showToast(
          error?.error?.detail || 'We couldn’t update that contact right now.',
          'danger',
        );
      },
    });
  }

    retry(): void {
      this.reload$.next();
    }

    onToastDismiss(): void {
      this.toastState.update((state) => ({
        ...state,
        isOpen: false,
      }));
    }

    private showToast(message: string, color: 'success' | 'danger'): void {
      this.toastState.set({
        isOpen: false,
        message,
        color,
      });

      queueMicrotask(() => {
        this.toastState.set({
          isOpen: true,
          message,
          color,
        });
      });
    }

    private mapToVm(data: ContactsPageData): ContactsPageVm {
      const contacts = data.contacts.map((contact) => {
          const displayLabel = this.cleanText(contact.nickName) || 'Trusted contact';

          return {
              id: Number(contact.contactUserId),
              displayLabel,
              nickName: this.cleanText(contact.nickName),
              initials: this.toInitials(displayLabel),
              favorite: !!contact.favorite,
              createdAt: contact.createdAt ?? null,
              createdLabel: this.formatRelativeDate(contact.createdAt),
          } satisfies ContactCardVm;
      });

      const pendingInvitations = data.pendingInvitations.map((invitation) => {
          const displayLabel =
              this.cleanText(invitation.senderDisplayName) ||
              this.cleanText(invitation.senderEmail) ||
              'Pending invitation';

        return {
            id: invitation.invitationId,
            senderUserId: invitation.senderUserId ?? null,
            displayLabel,
            nickName: this.cleanText(invitation.nickName),
            initials: this.toInitials(displayLabel),
              createdAt: invitation.createdAt ?? null,
              createdLabel: this.formatRelativeDate(invitation.createdAt),
          } satisfies PendingInvitationCardVm;
      });

      return {
          contacts,
          pendingInvitations,
          showFullyEmptyState: contacts.length === 0 && pendingInvitations.length === 0
      };
    }

    private formatRelativeDate(value: string | null | undefined): string {
      if (!value) {
        return 'recently';
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return 'recently';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        return 'today';
      }

      if (diffDays === 1) {
        return 'yesterday';
      }

      if (diffDays < 7) {
        return `${diffDays} days ago`;
      }

      return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: now.getFullYear() === date.getFullYear() ? undefined : 'numeric',
      }).format(date);
    }

    private toInitials(value: string): string {
      const words = value
        .split(/\s+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 2);

      if (words.length === 0) {
        return 'VC';
      }

      return words.map((part) => part.charAt(0).toUpperCase()).join('');
    }

    private cleanText(value: string | null | undefined): string | null {
      const trimmed = value?.trim();
      return trimmed ? trimmed : null;
    }
}
