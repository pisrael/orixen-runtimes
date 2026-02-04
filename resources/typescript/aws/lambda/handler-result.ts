import { StatusCode } from './function-status';
import { OutputData } from "./io-types";

export default class HandlerResult {
  private _results: any[] = [];
  private _statusCode?: StatusCode;

  addResult(payload: any, statusCode?: StatusCode) {
    this._results.push(payload);
    if (!this._statusCode && statusCode) {
      this._statusCode = statusCode;
    }
  }

  get result() {
    if (this._results.length === 0) {
      return null;
    } else if (this._results.length === 1) {
      return this._results[0];
    } else {
      return this._results;
    }
  }

  get statusCode() {
    return this._statusCode || 200;
  }
}