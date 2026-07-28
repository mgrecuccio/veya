import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { IonicModule, AlertController } from '@ionic/angular';
import { ContactsPageData, ContactsPageDataService } from "./data/contacts-page-data.service";
import { catchError, map, Observable, of, shareReplay, startWith, Subject, switchMap } from "rxjs";
import { getApiErrorMessage } from "src/app/core/api/api-error.util";
import { AppToastColor, AppToastService } from "src/app/shared/toast/app-toast.service";

type ContactsPageVmState =
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'success'; data: ContactsPageVm };

interface ContactsPageVm {
  contacts: ContactCardVm[];
  blockedContacts: ContactCardVm[];
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
        RouterModule,
    ],
    templateUrl: './contacts.page.html',
    styleUrls: ['./contacts.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsPage {
  
    private readonly fb = inject(FormBuilder);
    private readonly contactsDataService = inject(ContactsPageDataService);
    private readonly alertController = inject(AlertController);
    private readonly appToastService = inject(AppToastService);
    private readonly reload$ = new Subject<void>();
    private hasEntered = false;

    readonly inviteExpanded = signal(false);
    readonly inviteSubmitting = signal(false);
    readonly rowActionBusyId = signal<number | null>(null);
    readonly contactActionsOpen = signal(false);
    readonly contactActionsContact = signal<ContactCardVm | null>(null);
    readonly contactNicknameEditorOpen = signal(false);
    readonly contactNicknameDraft = signal('');
    readonly toastState = signal<{
      isOpen: boolean;
      message: string;
      color: AppToastColor;
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

    ionViewWillEnter(): void {
      if (!this.hasEntered) {
        this.hasEntered = true;
        return;
      }

      this.retry();
    }

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
            getApiErrorMessage(error, 'We couldn’t send that invitation right now.'),
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

    rejectInvitation(invitation: PendingInvitationCardVm): void {
      if (this.rowActionBusyId() !== null) {
        return;
      }

      this.rowActionBusyId.set(invitation.id);

      this.contactsDataService.rejectInvitation(invitation.id).subscribe({
        next: () => {
          this.rowActionBusyId.set(null);
          this.retry();
          this.showToast('Invitation rejected.', 'success');
        },
        error: (error: Error) => {
          this.rowActionBusyId.set(null);
          this.showToast(
            error.message || 'We couldn’t reject that invitation right now.',
            'danger',
          );
        },
      });
    }

    openContactActions(contact: ContactCardVm): void {
      if (this.rowActionBusyId() !== null || this.contactActionsOpen()) {
        return;
      }

      this.contactActionsContact.set(contact);
      this.contactNicknameEditorOpen.set(false);
      this.contactNicknameDraft.set('');
      this.contactActionsOpen.set(true);
    }

    closeContactActions(): void {
      this.contactActionsOpen.set(false);
      this.contactNicknameEditorOpen.set(false);
      this.contactNicknameDraft.set('');
    }

    editManagedContact(contact: ContactCardVm): void {
      this.contactNicknameDraft.set(contact.nickName ?? '');
      this.contactNicknameEditorOpen.set(true);
    }

    saveManagedContactNickname(contact: ContactCardVm): void {
      const nickName = this.contactNicknameDraft().trim();

      if (!nickName || nickName === contact.nickName) {
        return;
      }

      this.closeContactActions();
      this.updateContactNickname(contact.id, nickName, contact.favorite);
    }

    removeManagedContact(contact: ContactCardVm): void {
      this.closeContactActions();
      this.removeContact(contact);
    }

    blockManagedContact(contact: ContactCardVm): void {
      this.closeContactActions();
      this.blockContact(contact);
    }

    unblockContact(contact: ContactCardVm): void {
      if (this.rowActionBusyId() !== null) {
        return;
      }

      this.rowActionBusyId.set(contact.id);

      this.contactsDataService.unblockContact(contact.id).subscribe({
        next: () => {
          this.rowActionBusyId.set(null);
          this.retry();
          this.showToast('Contact unblocked.', 'success');
        },
        error: (error: Error) => {
          this.rowActionBusyId.set(null);
          this.showToast(
            error.message || 'We couldn’t unblock that contact right now.',
            'danger',
          );
        },
      });
    }

    toggleFavorite(contact: ContactCardVm): void {
      if (this.rowActionBusyId() !== null) {
        return;
      }

      const favorite = !contact.favorite;
      this.rowActionBusyId.set(contact.id);

      this.contactsDataService.editContact(contact.id, {
        nickName: contact.nickName,
        favorite,
      }).subscribe({
        next: () => {
          this.rowActionBusyId.set(null);
          this.retry();
          this.showToast(
            favorite ? 'Added to favorites.' : 'Removed from favorites.',
            'success',
          );
        },
        error: (error: any) => {
          this.rowActionBusyId.set(null);
          this.showToast(
            getApiErrorMessage(error, 'We couldn’t update that contact right now.'),
            'danger',
          );
        },
      });
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

            this.updateContactNickname(invitation.senderUserId!, nickName, false);
          },
        },
      ],
    });

    await alert.present();
  }

  private updateContactNickname(contactUserId: number, nickName: string, favorite: boolean): void {
    this.rowActionBusyId.set(contactUserId);

    this.contactsDataService.editContact(contactUserId, { nickName, favorite }).subscribe({
      next: () => {
        this.rowActionBusyId.set(null);
        this.retry();
        this.showToast('Contact nickname updated.', 'success');
      },
      error: (error: any) => {
        this.rowActionBusyId.set(null);
        this.showToast(
          getApiErrorMessage(error, 'We couldn’t update that contact right now.'),
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

    private showToast(message: string, color: AppToastColor): void {
      this.toastState.set({
        isOpen: true,
        message,
        color,
      });

      void this.appToastService.show(message, color, 'app-toast contacts-page-toast');
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

      const blockedContacts = data.blockedContacts.map((contact) => {
          const displayLabel = this.cleanText(contact.nickName) || 'Blocked contact';

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
          blockedContacts,
          pendingInvitations,
          showFullyEmptyState:
            contacts.length === 0 &&
            blockedContacts.length === 0 &&
            pendingInvitations.length === 0
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
