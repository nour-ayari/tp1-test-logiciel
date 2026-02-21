import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-quick-nav-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './quick-nav-card.html',
  styleUrls: ['./quick-nav-card.css'],
})
export class QuickNavCard {
  title = input.required<string>();
  description = input.required<string>();
  linkText = input.required<string>();
  linkRoute = input.required<string>();
  icon = input('');
}
