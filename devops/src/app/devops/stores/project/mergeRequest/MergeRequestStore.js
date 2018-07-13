import { observable, action, computed } from 'mobx';
import { axios, store, stores } from 'choerodon-front-boot';

const { AppState } = stores;

@store('MergeRequestStore')
class MergeRequestStore {
  @observable loading = true;
  @observable apps = [];
  @observable mergeData = [];
  @observable params = [];
  @observable pageInfo = {};
  @observable currentApp = {};
  @observable url = '';


  @action setTableFilter(param) {
    if (param) {
      this.params = param;
    } else {
      this.params = [];
    }
  }

  @computed get getParams() {
    return this.params.slice();
  }

  @action setPageInfo(page) {
    this.pageInfo = page;
  }

  @computed get getPageInfo() {
    return this.pageInfo;
  }

  @action setApps(apps) {
    this.apps = apps;
  }

  @computed get getApps() {
    return this.apps;
  }

  @action setUrl(url) {
    this.url = url;
  }

  @computed get getUrl() {
    return this.url;
  }

  @action setMerge(mergeData) {
    this.mergeData = mergeData;
  }

  @computed get getMerge() {
    return this.mergeData;
  }

  @computed
  get getIsLoading() {
    return this.loading;
  }

  @action setLoading(data) {
    this.loading = data;
  }

  @action setCurrentApp(data) {
    this.currentApp = data;
  }

  loadInitData = () => {
    this.setLoading(true);
    this.loadApps(AppState.currentMenuType.id).then((res) => {
      this.setApps(res || []);
      const response = this.handleProptError(res);
      if (response) {
        if (res.length) {
          const defaultApp = res[0];
          this.setCurrentApp(defaultApp);
          this.loadMergeRquest(defaultApp.id);
          this.loadUrl(AppState.currentMenuType.id, defaultApp.id);
        } else {
          this.setLoading(false);
        }
      }
    });
  };

  loadMergeRquest(appId, key = 'opened', page = 0, size = 10, projectId = AppState.currentMenuType.id) {
    this.setMerge([]);
    this.setLoading(true);
    if (key === 'all') {
      axios.get(`/devops/v1/projects/${projectId}/apps/${appId}/git/merge_request/list?page=${page}&size=${size}`)
        .then((res) => {
          const response = this.handleProptError(res);
          if (response) {
            this.setPageInfo({
              current: res.pageResult.number + 1,
              pageSize: res.pageResult.size,
              total: res.pageResult.totalElements,
            });
            this.setMerge(res);
          }
          this.setLoading(false);
        })
        .catch((error) => {
          this.setLoading(false);
          Choerodon.prompt(error.message);
        });
    } else {
      axios.get(`/devops/v1/projects/${projectId}/apps/${appId}/git/merge_request/list?state=${key}&page=${page}&size=${size}`)
        .then((res) => {
          const response = this.handleProptError(res);
          if (response) {
            this.setPageInfo({
              current: res.pageResult.number + 1,
              pageSize: res.pageResult.size,
              total: res.pageResult.totalElements,
            });
            this.setMerge(res);
          }
          this.setLoading(false);
        })
        .catch((error) => {
          this.setLoading(false);
          Choerodon.prompt(error.message);
        });
    }
  }


  loadApps(projectId) {
    return axios.get(`/devops/v1/projects/${projectId}/apps`)
      .then(datas => this.handleProptError(datas));
  }

  loadUrl(projectId, appId) {
    return axios.get(`/devops/v1/projects/${projectId}/apps/${appId}/git/url`)
      .then((data) => {
        if (data && data.failed) {
          Choerodon.prompt(data.message);
        } else {
          this.setUrl(data);
        }
      });
  }

  handleProptError =(error) => {
    if (error && error.failed) {
      Choerodon.prompt(error.message);
      return false;
    } else {
      return error;
    }
  }
}

const mergeRequestStore = new MergeRequestStore();
export default mergeRequestStore;