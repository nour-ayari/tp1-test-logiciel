import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CinemaService } from '../../../services/cinema.service';
import { catchError, debounceTime, distinctUntilChanged, filter, of, switchMap, tap } from 'rxjs';
import { rxResource, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Cinema } from '../../../models/cinema.model';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',

})
export class SearchBar {
  formBuilder = inject(FormBuilder);
  cinemaService = inject(CinemaService);

  form = this.formBuilder.group({ search: [''] });

  get searchControl(): AbstractControl {
    return this.form.get('search')!;
  }

  searchResults = rxResource({
    stream: () =>
      this.searchControl.valueChanges.pipe(
        filter((q): q is string => !!q && q.length >= 2),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => this.cinemaService.searchCinemas(q)),
        catchError(() => of([])),
      ),
    defaultValue: [],
  });
}
