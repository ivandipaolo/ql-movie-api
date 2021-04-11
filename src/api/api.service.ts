import { HttpService, Injectable, UnauthorizedException } from '@nestjs/common';
import { AxiosError } from 'axios';
import { START_TIME_CONFIG } from 'src/common/common.constants';
import { errorMessage } from 'src/errors/errors';
import { Movie } from 'src/movies/entities/movie.entity';
import { Person } from 'src/people/entities/person.entity';
import { Episode } from 'src/shows/entities/episode.entity';
import { Season } from 'src/shows/entities/season.entity';
import { Show } from 'src/shows/entities/show.entity';
import { Parameters } from './api.interface';
import { httpLog } from './api.logger';

@Injectable()
export class ApiService {
  constructor(private readonly httpService: HttpService) {}

  private async get<Element>(
    url: string,
    params?: Parameters,
  ): Promise<Element> {
    try {
      const { data } = await this.httpService.get(url, { params }).toPromise();
      if (data.results) {
        return data.results;
      } else {
        return data;
      }
    } catch (e) {
      if (!e.response) {
        // No Internet connection
        console.error(errorMessage.noConnection);
        throw new Error(errorMessage.noConnection);
      }
      const { config, status, statusText } = (e as AxiosError).response;
      const { method, url, headers } = config;
      const startTime = headers[START_TIME_CONFIG];
      httpLog({
        service: 'HTTP Service',
        method,
        url,
        startTime,
        status,
        statusText,
      });

      if (status === 401) {
        // Invalid API Key Error
        throw new Error(errorMessage.invalidApiKey);
      }
      if (500 <= status) {
        // TMDB Server Error
        throw new Error(errorMessage.serverError(statusText));
      }
      return undefined;
    }
  }

  movies = {
    nowPlaying: (): Promise<Movie[]> => this.get<Movie[]>('movie/now_playing'),

    upcoming: (): Promise<Movie[]> => this.get<Movie[]>('movie/upcoming'),

    popular: (): Promise<Movie[]> => this.get<Movie[]>('movie/popular'),

    findById: (id: number): Promise<Movie> =>
      this.get<Movie>(`movie/${id}`, {
        append_to_response: 'videos,credits',
      }),

    findSimilarById: (id: number): Promise<Movie[]> =>
      this.get<Movie[]>(`movie/${id}/similar`),
  };

  shows = {
    topRated: (): Promise<Show[]> => this.get<Show[]>('tv/top_rated'),

    popular: (): Promise<Show[]> => this.get<Show[]>('tv/popular'),

    airingToday: (): Promise<Show[]> => this.get<Show[]>('tv/airing_today'),

    findById: (id: number): Promise<Show> =>
      this.get<Show>(`tv/${id}`, {
        append_to_response: 'videos,credits',
      }),

    findSimilarById: (id: number): Promise<Show[]> =>
      this.get<Show[]>(`tv/${id}/similar`),

    getSeasonDetail: (showId: number, seasonNumber: number): Promise<Season> =>
      this.get<Season>(`tv/${showId}/season/${seasonNumber}`),

    getEpisodeDetail: (
      showId: number,
      seasonNumber: number,
      episodeNumber: number,
    ): Promise<Episode> =>
      this.get<Episode>(
        `tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`,
      ),
  };

  people = {
    findPersonById: (id: number): Promise<Person> =>
      this.get<Person>(`person/${id}`),
  };

  search = {
    movie: (query: string): Promise<Movie[]> =>
      this.get<Movie[]>('search/movie', { query }),

    show: (query: string): Promise<Show[]> =>
      this.get<Show[]>('search/tv', { query }),

    person: (query: string): Promise<Person[]> =>
      this.get<Person[]>('search/person', { query }),
  };
}
