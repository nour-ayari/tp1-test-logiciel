import { AsyncPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Observable, timer, map } from 'rxjs';

@Component({
  selector: 'app-partners-component',
  imports: [AsyncPipe],
  templateUrl: './partners-component.html',
  styleUrl: './partners-component.css',
})
export class PartnersComponent {
timerMs = input(1500);

  imagePaths = input<string[]>([

  'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
   'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png',
  'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
  'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg', 
  'https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/512px-Netflix_2015_logo.svg.png',

]
);

  
  paths$: Observable<string> = timer(0, this.timerMs()).pipe(
    map(index => this.imagePaths()[index % this.imagePaths().length])
  );
 
}
