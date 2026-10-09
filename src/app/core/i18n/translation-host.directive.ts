import {
  AfterViewInit,
  Directive,
  EffectRef,
  ElementRef,
  OnDestroy,
  effect,
  inject,
} from '@angular/core';
import { I18nService } from './i18n.service';

const TRANSLATED_ATTRIBUTES = ['aria-label', 'placeholder', 'title'] as const;

interface AttributeTranslationState {
  source: string;
  applied: string;
}

@Directive({
  selector: '[appTranslationHost]',
  standalone: true,
})
export class TranslationHostDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly i18n = inject(I18nService);
  private readonly textSources = new WeakMap<Text, { source: string; applied: string }>();
  private readonly attributeSources = new WeakMap<Element, Map<string, AttributeTranslationState>>();
  private observer?: MutationObserver;
  private viewReady = false;
  private readonly languageEffect: EffectRef;

  constructor() {
    this.languageEffect = effect(() => {
      this.i18n.language();
      if (this.viewReady) {
        this.translateAndObserve();
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.observer = new MutationObserver((mutations) => {
      this.observer?.disconnect();

      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          this.translateNode(mutation.target);
        } else if (mutation.type === 'attributes') {
          this.translateElementAttribute(mutation.target as Element, mutation.attributeName);
        } else {
          mutation.addedNodes.forEach((node) => this.translateNode(node));
        }
      }

      this.observe();
    });
    this.translateAndObserve();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.languageEffect.destroy();
  }

  private translateAndObserve(): void {
    this.observer?.disconnect();
    this.translateNode(this.host);
    this.observe();
  }

  private observe(): void {
    this.observer?.observe(this.host, {
      attributes: true,
      attributeFilter: [...TRANSLATED_ATTRIBUTES],
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  private translateNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      this.translateTextNode(node as Text);
      return;
    }

    if (!(node instanceof Element) && !(node instanceof ShadowRoot)) {
      return;
    }

    if (node instanceof Element) {
      TRANSLATED_ATTRIBUTES.forEach((attribute) =>
        this.translateElementAttribute(node, attribute),
      );
      if (node.shadowRoot) {
        this.translateNode(node.shadowRoot);
      }
    }

    node.childNodes.forEach((child) => this.translateNode(child));
  }

  private translateTextNode(node: Text): void {
    const current = node.nodeValue ?? '';
    const stored = this.textSources.get(node);
    const source = stored && stored.applied === current ? stored.source : current;
    const applied = this.i18n.translateRendered(source);

    this.textSources.set(node, { source, applied });
    if (applied !== current) {
      node.nodeValue = applied;
    }
  }

  private translateElementAttribute(element: Element, attributeName: string | null): void {
    if (!attributeName || !TRANSLATED_ATTRIBUTES.includes(attributeName as typeof TRANSLATED_ATTRIBUTES[number])) {
      return;
    }

    const current = element.getAttribute(attributeName);
    if (current === null) {
      return;
    }

    let states = this.attributeSources.get(element);
    if (!states) {
      states = new Map<string, AttributeTranslationState>();
      this.attributeSources.set(element, states);
    }

    const stored = states.get(attributeName);
    const source = stored && stored.applied === current ? stored.source : current;
    const applied = this.i18n.translateRendered(source);
    states.set(attributeName, { source, applied });

    if (applied !== current) {
      element.setAttribute(attributeName, applied);
    }
  }
}
