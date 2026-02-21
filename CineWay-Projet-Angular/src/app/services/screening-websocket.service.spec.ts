import { TestBed } from '@angular/core/testing';
import { ScreeningWebSocketService } from './screening-websocket.service';

describe('ScreeningWebSocketService', () => {
  let service: ScreeningWebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScreeningWebSocketService],
    });
    service = TestBed.inject(ScreeningWebSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('connection management', () => {
    it('should initialize with disconnected status', (done) => {
      service.getConnectionStatus().subscribe((status) => {
        expect(status).toBe('disconnected');
        done();
      });
    });

    it('should not be connected initially', () => {
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('getSeatUpdates', () => {
    it('should return an observable', () => {
      const updates$ = service.getSeatUpdates();
      expect(updates$).toBeDefined();
      expect(typeof updates$.subscribe).toBe('function');
    });
  });

  describe('getConnectionStatus', () => {
    it('should return an observable', () => {
      const status$ = service.getConnectionStatus();
      expect(status$).toBeDefined();
      expect(typeof status$.subscribe).toBe('function');
    });
  });

  afterEach(() => {
    service.disconnect();
  });
});
