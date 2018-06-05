import { observable, action, computed, autorun, whyRun } from 'mobx';
// import axios from 'Axios';
import axios from 'Axios';
import store from 'Store';
import { Observable } from 'rxjs';
import { List, formJS } from 'immutable';

const height = window.screen.height;
@store('EditVersionStore')
class EditVersionStore {
  @observable isRefresh= false;// 页面的loading
  @observable loading = false; // 打开tab的loading
  @observable singleData = null;
  @observable selectData = [];
  @observable apps = [];
  @observable pageInfo = {
    current: 1, total: 0, pageSize: height <= 900 ? 10 : 15,
  };
  @observable versionPage = {
    current: 0, total: 0, pageSize: height <= 900 ? 10 : 15,
  };
  @observable versionData = [];
  @observable type = [];

  @action setPageInfo(page) {
    this.pageInfo.current = page.number + 1;
    this.pageInfo.total = page.totalElements;
    this.pageInfo.pageSize = page.size;
  }

  @computed get getPageInfo() {
    return this.pageInfo;
  }


  @computed get getAllData() {
    // window.console.log(this.allData);
    return this.allData.slice();
  }

  @action setAllData(data) {
    this.allData = data;
    // window.console.log(this.allData);
  }

  @action setSelectData(data) {
    this.selectData = data;
    // window.console.log(this.allData);
  }
  @computed get getSelectData() {
    return this.selectData.slice();
    // window.console.log(this.allData);
  }

  @computed get getVersionData() {
    // window.console.log(this.allData);
    return this.versionData.slice();
  }

  @action setVersionData(data) {
    this.versionData = data;
    // window.console.log(this.allData);
  }

  @action setApps(data) {
    this.apps = data;
    // window.console.log(this.allData);
  }

  @action changeIsRefresh(flag) {
    this.isRefresh = flag;
  }

  @computed get getIsRefresh() {
    return this.isRefresh;
  }
  @action changeLoading(flag) {
    this.loading = flag;
  }

  @computed get getLoading() {
    return this.loading;
  }

  @action setSingleData(data) {
    this.singleData = data;
  }

  @computed get getSingleData() {
    return this.singleData;
  }

  @action setType(data) {
    this.type = data;
  }

  loadData = ({ isRefresh = false, projectId, page = this.pageInfo.current - 1, size = this.pageInfo.pageSize, sort = { field: 'id', order: 'desc' }, postData = { searchParam: {}, param: '' }, key = '1', id }) => {
    if (isRefresh) {
      this.changeIsRefresh(true);
    }
    this.changeLoading(true);
    if (key === '1') {
      return Observable.fromPromise(axios.post(`/devops/v1/projects/${projectId}/apps_market/${id}/versions?is_publish=false&page=${page}&size=${size}&sort=${sort.field},${sort.order}`, JSON.stringify(postData)))
        .subscribe((data) => {
          const res = this.handleProptError(data);
          if (res) {
            this.handleData(data);
          }
          this.changeLoading(false);
          this.changeIsRefresh(false);
        });
    } else {
      return Observable.fromPromise(axios.post(`/devops/v1/projects/${projectId}/apps_market/${id}/versions?is_publish=true&page=${page}&size=${size}&sort=${sort.field},${sort.order}`, JSON.stringify(postData)))
        .subscribe((data) => {
          const res = this.handleProptError(data);
          if (res) {
            this.handleData(data);
          }
          this.changeLoading(false);
          this.changeIsRefresh(false);
        });
    }
  };

  handleData =(data) => {
    this.setAllData(data.content);
    const { number, size, totalElements } = data;
    const page = { number, size, totalElements };
    this.setPageInfo(page);
  };

  loadApps = projectId =>
    axios.get(`/devops/v1/projects/${projectId}/apps/listById`)
      .then((data) => {
        const res = this.handleProptError(data);
        if (res) {
          this.setApps(data);
        }
      });

  loadDataById =(projectId, id) =>
    axios.get(`/devops/v1/projects/${projectId}/apps_market/${id}`).then((data) => {
      const res = this.handleProptError(data);
      if (res) {
        this.setSingleData(data);
        this.setSelectData(data.appVersions);
      }
    });

  checkCode =(projectId, code) =>
    axios.get(`/devops/v1/projects/${projectId}/apps/checkCode?code=${code}`);

  checkName = (projectId, name) =>
    axios.get(`/devops/v1/projects/${projectId}/apps/checkName?name=${name}`)
      .then((datas) => {
        const res = this.handleProptError(datas);
        return res;
      });

  updateData = (projectId, id, data) =>
    axios.put(`/devops/v1/projects/${projectId}/apps_market/${id}/versions`, JSON.stringify(data))
      .then((datas) => {
        const res = this.handleProptError(datas);
        return res;
      });

  addData = (projectId, data, img) =>
    axios.post(`/devops/v1/projects/${projectId}/apps_market`, JSON.stringify(data))
      .then((datas) => {
        const res = this.handleProptError(datas);
        return res;
      });
  uploadFile = (orgId, backName = 'devops-service', fileName, img) =>
    axios.post(`/file/v1/organization/${orgId}/file/backetName/${backName}?fileName=${fileName}`, img, {
      header: { 'Content-Type': 'multipart/form-data' },
    })
      .then((datas) => {
        const res = this.handleProptError(datas);
        return res;
      });;

  deleteData =(projectId, id) =>
    axios.post(`devops/v1/projects/${projectId}/apps_market/${id}/unpublish`)
      .then((datas) => {
        const res = this.handleProptError(datas);
        return res;
      });

  handleProptError =(error) => {
    if (error && error.failed) {
      Choerodon.prompt(error.message);
      return false;
    } else {
      return error;
    }
  }
}

const editVersionStore = new EditVersionStore();
export default editVersionStore;

// autorun(() => {
//   window.console.log(templateStore.allData.length);
//   whyRun();
// });