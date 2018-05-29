import { observable, action, computed } from 'mobx';
import axios from 'Axios';
import store from 'Store';

@store('AppStoreStore')
class AppStoreStore {
  @observable isLoading = true;
  @observable listActive = 'card';
  @observable appCards = [];
  @observable app = [];
  @observable pageInfo = {};

  @action setPageInfo(page) {
    this.pageInfo = { current: page.number + 1, total: page.totalElements, pageSize: page.size };
  }

  @computed get getPageInfo() {
    return this.pageInfo;
  }

  @action
  setAppCards(appCards) {
    this.appCards = appCards;
  }

  @computed
  get getAppCards() {
    return this.appCards;
  }

  @action
  setApp(app) {
    this.app = app;
  }

  @computed
  get getApp() {
    return this.app;
  }

  @action setListActive(listActive) {
    this.listActive = listActive;
  }

  @computed get getListActive() {
    return this.listActive;
  }

  @action
  changeLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }


  loadApps = (projectId, page = 0, size = 20, sorter = { id: 'asc' }, datas = {
    searchParam: {},
    param: '',
  }) => axios.post(`devops/v1/projects/${projectId}/apps_market/list_all?page=${page}&size=${size}`, JSON.stringify(datas)).then((data) => {
    this.changeLoading(true);
    if (data && data.failed) {
      Choerodon.prompt(data.message);
    } else {
      this.handleData(data);
      this.changeLoading(false);
    }
  });

  loadAppStore = (projectId, id) => axios.get(`devops/v1/projects/${projectId}/apps_market/${id}`).then((data) => {
    this.changeLoading(true);
    if (data && data.failed) {
      Choerodon.prompt(data.message);
    } else {
      this.setApp(data);
      this.changeLoading(false);
    }
  });

  handleData =(data) => {
    this.setAppCards(data.content);
    const { number, size, totalElements } = data;
    const page = { number, size, totalElements };
    this.setPageInfo(page);
  };
}

const appStoreStore = new AppStoreStore();
export default appStoreStore;
