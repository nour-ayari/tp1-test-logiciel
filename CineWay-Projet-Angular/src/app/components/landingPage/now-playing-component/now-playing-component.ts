import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MoviesApi } from '../../../services/movies-api';
import { Movie } from '../../movies/movie/movie';

@Component({
  selector: 'app-now-playing-component',
  imports: [Movie],
  templateUrl: './now-playing-component.html',
  styleUrl: './now-playing-component.css',

})
export class NowPlayingComponent {
  private moviesApi = inject(MoviesApi);

  moviesRes = rxResource({
    stream: () => this.moviesApi.getShowingMovies(),
  });
  movies = computed(() => this.moviesRes.value() ?? []);
  loading = computed(() => this.moviesRes.isLoading());
  error = computed(() => this.moviesRes.error());

  nowPlaying = computed(() => this.movies().slice(0, 5));
}
