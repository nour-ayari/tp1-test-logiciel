import { Component, inject, NgZone, signal } from '@angular/core';
import { WelcomeComponent } from "../welcome-component/welcome-component";
import { NowPlayingComponent } from "../now-playing-component/now-playing-component";
import { PartnersComponent } from "../partners-component/partners-component";
import { HowItWorksComponent } from "../how-it-works-component/how-it-works-component";

@Component({
  selector: 'app-landing-page-component',
  imports: [ WelcomeComponent, NowPlayingComponent,PartnersComponent, HowItWorksComponent],
  templateUrl: './landing-page-component.html',
  styleUrl: './landing-page-component.css',
})
export class LandingPageComponent {
  private ngZone = inject(NgZone);
  showNowPlaying = signal(false);

 onShowNowPlaying() {
  this.showNowPlaying.set(true);
  this.ngZone.runOutsideAngular(() => {
    setTimeout(() => {
      document
        .getElementById('nowPlaying')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center',
      });
    }, 0);
  });
}
}
