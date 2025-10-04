import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import {ThemeService} from '../../shared/services/theme.service'; // Import Observable

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent implements OnInit {

  // ✅ CORRECCIÓN 1: Declare the variable without immediate assignment
  isDarkTheme$!: Observable<boolean>;

  // ✅ CORRECCIÓN 2: Initialize the variable inside the constructor
  constructor(private themeService: ThemeService) {
    // Now this.themeService is initialized and ready to use
    this.isDarkTheme$ = this.themeService.isDarkTheme$;
  }

  ngOnInit(): void {
    // Puedes dejarlo vacío o usarlo para lógica posterior
  }

  /**
   * Llama al servicio para alternar el tema.
   */
  toggleTheme(): void {
    this.themeService.toggleDarkTheme();
  }
}
