import * as jamesApi from 'esn-api-client/src/api/james';
import Client from 'esn-api-client/src/Client';
import { ESNJamesApiClient } from '../../src';

jest.mock('esn-api-client/src/Client');

const jamesApiSpy = jest.spyOn(jamesApi, 'default');

describe('The ESNJamesApiClient class', () => {
  describe('The constructor method', () => {
    test('should throw error if esnApiClient is not provided', () => {
      expect(() => new ESNJamesApiClient({})).toThrow(/esnApiClient is required and must be an instance of Client/);
    });

    test('should throw error if esnApiClient is not an instance of Client', () => {
      const esnApiClient = new Date();

      expect(() => new ESNJamesApiClient({ esnApiClient })).toThrow(/esnApiClient is required and must be an instance of Client/);
    });

    test('should throw error if the saveAs method is not provided', () => {
      const esnApiClient = new Client();

      expect(() => new ESNJamesApiClient({ esnApiClient })).toThrow(/saveAs is required and must be a function/);
    });

    test('should throw error if the saveAs is not a function', () => {
      const esnApiClient = new Client();
      const saveAs = 'not a function';

      expect(() => new ESNJamesApiClient({ esnApiClient, saveAs })).toThrow(/saveAs is required and must be a function/);
    });

    test('should set the instance properties correctly if esnApiClient and saveAs are valid', () => {
      const esnApiClient = new Client();
      const saveAs = () => {};

      const esnJamesApiClient = new ESNJamesApiClient({ esnApiClient, saveAs });

      expect(esnJamesApiClient.saveAs).toBe(saveAs);
      expect(jamesApiSpy.mock.calls[0][0]).toBe(esnApiClient);
    });
  });

  describe('The downloadEmlFileFromMailRepository method', () => {
    test('should reject if failed to save the eml file', done => {
      const errorMessage = 'Something went wrong while saving the file';
      const esnApiClient = new Client();
      const saveAs = jest.fn().mockResolvedValue(Promise.reject(new Error(errorMessage)));
      const esnJamesApiClient = new ESNJamesApiClient({ esnApiClient, saveAs });
      const domainId = 'domainId';
      const mailRepository = 'mailRepository';
      const mailKey = 'mailKey';
      const emlContent = '<b>some eml content</b>';
      const mBlob = { foo: 'bar' };
      const blobSpy = jest.spyOn(global, 'Blob').mockImplementationOnce(() => mBlob);

      esnJamesApiClient.jamesApi = {
        downloadEmlFileFromMailRepository: jest.fn().mockResolvedValue(Promise.resolve(emlContent))
      };

      esnJamesApiClient.downloadEmlFileFromMailRepository(domainId, mailRepository, mailKey)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err.message).toEqual(errorMessage);
          expect(blobSpy).toHaveBeenCalledWith([emlContent], { type: 'text/html' });
          expect(saveAs).toHaveBeenCalled;
          expect(saveAs.mock.calls[0][0]).toBe(mBlob);
          expect(saveAs.mock.calls[0][1]).toBe(`${mailKey}.eml`);
          expect(esnJamesApiClient.jamesApi.downloadEmlFileFromMailRepository).toHaveBeenCalledWith(domainId, mailRepository, mailKey);
          done();
        });
    });

    test('should reject if failed to download the eml file', done => {
      const errorMessage = 'Something went wrong while downloading the file';
      const esnApiClient = new Client();
      const saveAs = jest.fn();
      const esnJamesApiClient = new ESNJamesApiClient({ esnApiClient, saveAs });
      const domainId = 'domainId';
      const mailRepository = 'mailRepository';
      const mailKey = 'mailKey';

      esnJamesApiClient.jamesApi = {
        downloadEmlFileFromMailRepository: jest.fn().mockResolvedValue(Promise.reject(new Error(errorMessage)))
      };

      esnJamesApiClient.downloadEmlFileFromMailRepository(domainId, mailRepository, mailKey)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err.message).toEqual(errorMessage);
          expect(saveAs).not.toHaveBeenCalled;
          expect(esnJamesApiClient.jamesApi.downloadEmlFileFromMailRepository).toHaveBeenCalledWith(domainId, mailRepository, mailKey);
          done();
        });
    });

    test('should be able to save the eml file with correct options after successfully downloading it', done => {
      const esnApiClient = new Client();
      const saveAs = jest.fn().mockResolvedValue(Promise.resolve());
      const esnJamesApiClient = new ESNJamesApiClient({ esnApiClient, saveAs });
      const domainId = 'domainId';
      const mailRepository = 'mailRepository';
      const mailKey = 'mailKey';
      const emlContent = '<b>some eml content</b>';
      const mBlob = { foo: 'bar' };
      const blobSpy = jest.spyOn(global, 'Blob').mockImplementationOnce(() => mBlob);

      esnJamesApiClient.jamesApi = {
        downloadEmlFileFromMailRepository: jest.fn().mockResolvedValue(Promise.resolve(emlContent))
      };

      esnJamesApiClient.downloadEmlFileFromMailRepository(domainId, mailRepository, mailKey)
        .then(() => {
          expect(blobSpy).toHaveBeenCalledWith([emlContent], { type: 'text/html' });
          expect(saveAs).toHaveBeenCalled;
          expect(saveAs.mock.calls[0][0]).toBe(mBlob);
          expect(saveAs.mock.calls[0][1]).toBe(`${mailKey}.eml`);
          expect(esnJamesApiClient.jamesApi.downloadEmlFileFromMailRepository).toHaveBeenCalledWith(domainId, mailRepository, mailKey);
          done();
        })
        .catch(err => done(err || new Error('should resolve')));
    });
  });
});
