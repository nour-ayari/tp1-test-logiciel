import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface SpecialOffer {
  id: number;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  image: string;
  category: 'student' | 'family' | 'seasonal';
  terms: string[];
  isActive: boolean;
}

@Component({
  selector: 'app-special-offers',
  imports: [CommonModule, RouterLink],
  templateUrl: './special-offers.html',
  styleUrl: './special-offers.css',
})
export class SpecialOffers {
  offers: SpecialOffer[] = [
    {
      id: 1,
      title: 'Student Discount',
      description: 'Special pricing for students with valid ID',
      discount: '25% OFF',
      validUntil: '2026-12-31',
      image: '/assets/offers/student.jpg',
      category: 'student',
      terms: [
        'Valid student ID required',
        'One ticket per student',
        'Cannot be combined with other offers',
      ],
      isActive: true,
    },
    {
      id: 2,
      title: 'Family Movie Night',
      description: 'Bring the whole family for special family pricing',
      discount: '30% OFF for 4+ tickets',
      validUntil: '2026-06-30',
      image: '/assets/offers/family.jpg',
      category: 'family',
      terms: [
        'Minimum 4 tickets required',
        'Valid for weekend showings',
        'Children under 12 half price',
      ],
      isActive: true,
    },
    {
      id: 3,
      title: 'Holiday Special',
      description: 'Celebrate the season with special holiday pricing',
      discount: '20% OFF all tickets',
      validUntil: '2026-01-31',
      image: '/assets/offers/holiday.jpg',
      category: 'seasonal',
      terms: [
        'Valid during December',
        'All showtimes included',
        'Cannot be combined with other offers',
      ],
      isActive: true,
    },
    {
      id: 4,
      title: 'Senior Citizen Discount',
      description: 'Special pricing for seniors 65+',
      discount: '15% OFF',
      validUntil: '2026-12-31',
      image: '/assets/offers/senior.jpg',
      category: 'seasonal',
      terms: ['Age 65+ required', 'Valid ID may be requested', 'Tuesday-Thursday only'],
      isActive: true,
    },
    {
      id: 5,
      title: 'First-Time Visitor',
      description: 'Welcome new customers with a special discount',
      discount: 'Free ticket upgrade',
      validUntil: '2026-12-31',
      image: '/assets/offers/welcome.jpg',
      category: 'seasonal',
      terms: ['First visit only', 'Upgrade standard to premium seating', 'Valid for one person'],
      isActive: true,
    },
  ];

  filteredOffers = this.offers;
  selectedCategory: string = 'all';

  filterOffers(category: string) {
    this.selectedCategory = category;
    if (category === 'all') {
      this.filteredOffers = this.offers;
    } else {
      this.filteredOffers = this.offers.filter((offer) => offer.category === category);
    }
  }

  getCategoryColor(category: string): string {
    const colors = {
      student: 'bg-blue-600',
      family: 'bg-green-600',
      seasonal: 'bg-orange-600',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-600';
  }

  getCategoryLabel(category: string): string {
    const labels = {
      student: 'Student',
      family: 'Family',
      seasonal: 'Seasonal',
    };
    return labels[category as keyof typeof labels] || category;
  }
}
