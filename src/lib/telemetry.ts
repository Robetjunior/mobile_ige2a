import { LOGGER } from './logger';

type TelemetryEvent =
  | 'home.view'
  | 'home.map_move'
  | 'home.open_station'
  | 'charge.remote_start.request'
  | 'charge.remote_start.success'
  | 'charge.remote_start.fail'
  | 'auth.logout';

export interface TelemetryPayload {
  [k: string]: any;
}

export const Telemetry = {
  track(event: TelemetryEvent, payload?: TelemetryPayload) {
    try {
      LOGGER.APP.info(`telemetry:${event}`, payload || {});
    } catch (e) {
      // ignore
    }
  },
};

export default Telemetry;