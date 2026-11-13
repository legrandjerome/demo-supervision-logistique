import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Equipment, EQUIPMENT_STATUS_LABELS, EQUIPMENT_TYPE_LABELS } from '@demo/domain';
import { layoutWarehouse, PlanNode } from './warehouse-layout';

/**
 * Plan de l'entrepôt en SVG. Le composant ne connaît aucun store : il reçoit les équipements,
 * les missions en cours et la sélection, et signale les clics.
 */
@Component({
  selector: 'app-warehouse-plan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + plan().width + ' ' + plan().height"
      role="group"
      aria-label="Plan de l’entrepôt : les équipements par zone, dans le sens du flux"
    >
      <defs>
        <marker
          id="flow-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" class="arrow-head" />
        </marker>
      </defs>

      @for (zone of plan().zones; track zone.name) {
        <rect
          class="zone"
          [attr.x]="zone.x"
          y="0"
          [attr.width]="zone.width"
          [attr.height]="plan().height"
          rx="10"
        />
        <text class="zone-title" [attr.x]="zone.x + 16" y="26">{{ zone.name }}</text>
      }

      @for (flow of plan().flows; track $index) {
        <line
          class="flow"
          [attr.x1]="flow.x1"
          [attr.x2]="flow.x2"
          [attr.y1]="flow.y"
          [attr.y2]="flow.y"
          marker-end="url(#flow-arrow)"
        />
      }

      @for (node of plan().nodes; track node.equipment.id) {
        <g
          class="node"
          role="button"
          tabindex="0"
          [attr.data-status]="node.equipment.status"
          [class.selected]="node.equipment.id === selectedId()"
          [attr.aria-pressed]="node.equipment.id === selectedId()"
          [attr.aria-label]="describe(node)"
          [attr.transform]="'translate(' + node.x + ',' + node.y + ')'"
          (click)="selected.emit(node.equipment)"
          (keydown.enter)="selected.emit(node.equipment)"
          (keydown.space)="$event.preventDefault(); selected.emit(node.equipment)"
        >
          <rect class="card" [attr.width]="node.width" [attr.height]="node.height" rx="8" />
          <rect class="stripe" width="6" [attr.height]="node.height" rx="3" />
          <text class="code" x="18" y="23">{{ node.equipment.code }}</text>
          <text class="status" x="18" y="43">{{ statusLabels[node.equipment.status] }}</text>
          @if (node.missions > 0) {
            <g [attr.transform]="'translate(' + (node.width - 86) + ',10)'">
              <rect class="pill" width="76" height="20" rx="10" />
              <text class="pill-label" x="38" y="14">{{ node.missions }} en cours</text>
            </g>
          }
        </g>
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
    }
    .zone {
      fill: var(--mat-sys-surface-container);
    }
    .zone-title {
      fill: var(--mat-sys-on-surface-variant);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .flow {
      stroke: var(--mat-sys-outline);
      stroke-width: 1.5;
    }
    .arrow-head {
      fill: var(--mat-sys-outline);
    }
    .node {
      --status: #74777f;
      cursor: pointer;
      outline: none;
    }
    .node[data-status='RUNNING'] {
      --status: #2e7d32;
    }
    .node[data-status='FAULT'] {
      --status: var(--mat-sys-error);
    }
    .node[data-status='MAINTENANCE'] {
      --status: #b26a00;
    }
    .card {
      fill: var(--mat-sys-surface-container-lowest);
      stroke: var(--mat-sys-outline-variant);
      stroke-width: 1;
      transition:
        stroke 120ms,
        fill 120ms;
    }
    .node:hover .card {
      stroke: var(--mat-sys-outline);
    }
    .node:focus-visible .card,
    .node.selected .card {
      stroke: var(--mat-sys-primary);
      stroke-width: 2.5;
    }
    .node.selected .card {
      fill: var(--mat-sys-primary-container);
    }
    .stripe {
      fill: var(--status);
      transition: fill 300ms;
    }
    .code {
      fill: var(--mat-sys-on-surface);
      font-family: ui-monospace, monospace;
      font-size: 14px;
      font-weight: 600;
    }
    .status {
      fill: var(--mat-sys-on-surface-variant);
      font-size: 12px;
    }
    .pill {
      fill: #2a78d6;
    }
    .pill-label {
      fill: #ffffff;
      font-size: 11px;
      font-weight: 600;
      text-anchor: middle;
    }
    @media (prefers-reduced-motion: reduce) {
      .card,
      .stripe {
        transition: none;
      }
    }
  `,
})
export class WarehousePlan {
  readonly equipments = input.required<readonly Equipment[]>();
  readonly missionCountByCode = input<Readonly<Record<string, number>>>({});
  readonly selectedId = input<number | null>(null);
  readonly selected = output<Equipment>();

  protected readonly statusLabels = EQUIPMENT_STATUS_LABELS;
  protected readonly plan = computed(() =>
    layoutWarehouse(this.equipments(), this.missionCountByCode()),
  );

  protected describe(node: PlanNode): string {
    const { code, name, type, status } = node.equipment;
    const missions = node.missions ? `, ${node.missions} mission(s) en cours` : '';
    return `${code}, ${name}, ${EQUIPMENT_TYPE_LABELS[type]}, ${EQUIPMENT_STATUS_LABELS[status].toLowerCase()}${missions}`;
  }
}
