import { TestBed } from '@angular/core/testing';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('affiche le libellé et expose le ton au style', async () => {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('label', 'En défaut');
    fixture.componentRef.setInput('tone', 'danger');
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('En défaut');
    expect(host.getAttribute('data-tone')).toBe('danger');
  });

  it('utilise le ton neutre par défaut', async () => {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('label', 'Créée');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).getAttribute('data-tone')).toBe('neutral');
  });
});
