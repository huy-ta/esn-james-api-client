import Client from 'esn-api-client/src/Client';
import jamesApi from 'esn-api-client/src/api/james';

export default class ESNJamesApiClient {
  /**
   * @constructor
   * @param {Object} options                An options object that contains:
   * @param {Function} options.esnApiClient the instance of Client to communicate with ESN's Backend APIs
   * @param {Function} options.saveAs       the function to save file
   */
  constructor({ esnApiClient, saveAs }) {
    if (!(esnApiClient instanceof Client)) {
      throw new Error('esnApiClient is required and must be an instance of Client');
    }

    if (typeof saveAs !== 'function') {
      throw new Error('saveAs is required and must be a function');
    }

    this.saveAs = saveAs;
    this.jamesApi = jamesApi(esnApiClient);
  }

  downloadEmlFileFromMailRepository(domainId, mailRepository, mailKey) {
    return this.jamesApi.downloadEmlFileFromMailRepository(domainId, mailRepository, mailKey)
      .then(data => {
        const emlData = new Blob([data], { type: 'text/html' });

        return this.saveAs(emlData, [mailKey, 'eml'].join('.'));
      });
  }
}
