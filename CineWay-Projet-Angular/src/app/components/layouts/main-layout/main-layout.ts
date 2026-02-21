import { Component } from '@angular/core';
import { NavbarComponent } from "../../navbar-component/navbar-component";
import { FooterComponent } from "../../footer-component/footer-component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [NavbarComponent,RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {

}
