import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [CommonModule, RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  stats = [
    { number: '500K+', label: 'Happy Customers' },
    { number: '1000+', label: 'Movies Available' },
    { number: '50+', label: 'Cinema Partners' },
    { number: '24/7', label: 'Customer Support' },
  ];
}
