import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  imports: [CommonModule],
  templateUrl: './stats-card.html',
  styleUrls: ['./stats-card.css'],
})
export class StatsCard {
  title = input.required<string>();
  value = input.required<string | number>();
  iconPath = input('');
  iconBg = input('bg-blue-500/15');
  iconColor = input('text-blue-400');
}
