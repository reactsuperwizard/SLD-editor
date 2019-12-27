import {Injectable} from '@angular/core';
import {HelperService} from './helper.service';
import {delay, filter, map} from 'rxjs/operators';

const MOCK_API_DELAY = 1000;

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  constructor(private helper: HelperService) {
  }

  /**
   * gets the applications
   * @returns  the applications data
   */
  get() {
    return this.helper.get('/assets/data/db.json').pipe(delay(MOCK_API_DELAY));
  }

  getAllUsers(pageSize: number, pageNumber: number = 0) {

    return this.helper.get('/assets/data/GetAllUsers.json').pipe(delay(MOCK_API_DELAY))
      .pipe(map(ret => ({
        data: ret.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize),
        totalElements: ret.length,
        pafeSize: pageSize,
        pageNumber: pageNumber
      })));
  }

  getExecutionTeams() {
    return this.helper.get('/assets/data/GetExecutionTeams.json').pipe(delay(MOCK_API_DELAY));
  }

  getRoles() {
    return this.helper.get('/assets/data/GetRoles.json').pipe(delay(MOCK_API_DELAY));
  }

  getAllSkills() {
    return this.helper.get('/assets/data/GetAllSkills.json').pipe(delay(MOCK_API_DELAY));
  }

  getSingleUserDetails() {
    return this.helper.get('/assets/data/GetSingleUserDetails.json').pipe(delay(MOCK_API_DELAY));
  }

  getDocumentTypes() {
    return this.helper.get('/assets/data/GetDocumentTypes.json').pipe(delay(MOCK_API_DELAY));
  }

  getImageType() {
    return this.helper.get('/assets/data/GetImageType.json').pipe(delay(MOCK_API_DELAY));
  }

  getAllProjects() {
    return this.helper.get('/assets/data/GetAllProjects.json').pipe(delay(MOCK_API_DELAY));
  }

  getAllKnowledgeBanks() {
    return this.helper.get('/assets/data/GetAllKnowledgeBanks.json').pipe(delay(MOCK_API_DELAY));
  }

  getMasterData() {
    return this.helper.get('/assets/data/GetMasterData.json').pipe(delay(MOCK_API_DELAY));
  }

  getProject() {
    return this.helper.get('/assets/data/GetProject.json').pipe(delay(MOCK_API_DELAY));
  }

  getProjectOutage() {
    return this.helper.get('/assets/data/GetProjectOutage.json').pipe(delay(MOCK_API_DELAY));
  }

  getProjectModalling() {
    return this.helper.get('/assets/data/GetProjectModalling.json').pipe(delay(MOCK_API_DELAY));
  }

  getProjectModallingArea(type: string) {
    return this.helper.get(`/assets/data/GetProjectModalling${type}.json`).pipe(delay(MOCK_API_DELAY));
  }

  getTaskCriterias(type: string) {
    return this.helper.get(`/assets/data/GetTaskCriterias${type}.json`).pipe(delay(MOCK_API_DELAY));
  }

  getMapMarkers() {
    return this.helper.get(`/assets/data/GetMapMarkers.json`).pipe(delay(MOCK_API_DELAY));
  }

  getRiskMatrix() {
    return this.helper.get(`/assets/data/GetRiskMatrix.json`).pipe(delay(MOCK_API_DELAY));
  }
  getSkills() {
    return this.helper.get(`/assets/data/GetSkills.json`).pipe(delay(MOCK_API_DELAY));
  }

  getAssets(pageSize: number, pageNumber: number = 0, searchText: string = '', filterItems = []) {

    return this.helper.get('/assets/data/GetAssets.json').pipe(delay(MOCK_API_DELAY))
      .pipe(map(ret => {
        const data = ret.filter(item => {
          if (!searchText) {
            return item;
          }
          return filterItems.some(filterItem => {
            let searchTxt = item[filterItem.prop] || '';
            if (!(item[filterItem.prop] instanceof String)) {
              searchTxt = JSON.stringify(item[filterItem.prop]);
            }
            return searchTxt.toLowerCase().indexOf(searchText) !== -1;
          });
        });
        return {
          data: data.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize),
          totalElements: data.length,
          pafeSize: pageSize,
          pageNumber: pageNumber
        };
      }));
  }

  getReliabilityCenterData() {
    return this.helper.get('/assets/data/GetReliabilityCenterData.json').pipe(delay(MOCK_API_DELAY));
  }

}
