import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Modal, Select, Icon } from 'choerodon-ui';
import { stores } from 'choerodon-front-boot';
import yaml from 'js-yaml';
import { injectIntl, FormattedMessage } from 'react-intl';
import _ from 'lodash';
import Ace from '../../../../components/yamlAce';
import '../AppDeploy.scss';
import '../../../main.scss';

const { Sidebar } = Modal;
const { AppState } = stores;
const Option = Select.Option;

@observer
class UpgradeIst extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: undefined,
      value: '',
      verValue: undefined,
    };
  }

  componentWillReceiveProps() {
    const value = yaml.safeLoad(this.props.store.getValue);
    this.setState({
      value,
    });
  }

  /**
   * 事件处理，修改value值后写入store
   * @param {*} value 修改后的value值
   */
  onChange = (value) => {
    const { store } = this.props;
    const projectId = AppState.currentMenuType.id;
    store.checkYaml(value, projectId)
      .then((data) => {
        this.setState({ errorLine: data });
      });
    this.setState({
      value,
    });
  };

  /**
   * 关闭弹窗
   * @param res
   */
  onClose = (res) => {
    this.setState({
      value: this.props.store.getValue,
    });
    this.props.onClose(res);
  };
  /**
   * 修改配置升级实例
   */
  handleOk = () => {
    const { store, id, idArr, intl } = this.props;
    const projectId = AppState.currentMenuType.id;
    const value = this.state.value || this.props.store.getValue.yaml;
    const data = {
      values: value,
      appInstanceId: id,
      environmentId: idArr[0],
      appVerisonId: this.state.id,
      appId: idArr[2],
      type: 'update',
    };
    store.checkYaml(value, projectId)
      .then((datas) => {
        this.setState({ errorLine: datas });
        if (datas.length === 0) {
          store.reDeploy(projectId, data)
            .then((res) => {
              if (res && res.failed) {
                Choerodon.prompt(res.message);
              } else {
                this.onClose(res);
              }
            });
        } else {
          Choerodon.prompt(intl.formatMessage({ id: 'ist.yamlErr' }));
        }
      });
  };

  handleChange(id) {
    this.setState({
      id,
    });
  }

  render() {
    const { intl } = this.props;
    const data = this.props.store.getValue;
    const verValue = this.props.store.getVerValue;
    let error = data.errorLines;
    if (this.state.errorLine !== undefined) {
      error = this.state.errorLine;
    }
    const sideDom = (<div className="c7n-region">
      <h2 className="c7n-space-first">
        <FormattedMessage
          id="ist.editHead"
          values={{
            name: `${this.props.name}`,
          }}
        />
      </h2>
      <p>
        <FormattedMessage id="ist.upgradeDes" />
        <a href={intl.formatMessage({ id: 'ist.link' })} rel="nofollow me noopener noreferrer" target="_blank" className="c7n-external-link">
          <span className="c7n-external-link-content">
            <FormattedMessage id="learnmore" />
          </span>
          <span className="icon icon-open_in_new" />
        </a>
      </p>
      {verValue && (<div>
        <Select
          className="c7n-app-select_512"
          notFoundContent={this.props.intl.formatMessage({ id: 'ist.noUpVer' })}
          value={this.state.id || (verValue.length ? verValue[0].id : undefined)}
          label={this.props.intl.formatMessage({ id: 'deploy.step.one.version.title' })}
          filterOption={(input, option) =>
            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          filter
          onChange={this.handleChange.bind(this)}
        >
          {
            _.map(verValue, app =>
              <Option key={app.id} value={app.id}>{app.version}</Option>,
            )
          }
        </Select>
        {verValue.length === 0 ? <div>
          <Icon type="error" className="c7n-noVer-waring" />
          {intl.formatMessage({ id: 'ist.noUpVer' })}
        </div> : null}
      </div>)}
      <div className="c7n-ace-section">
        <div className="c7n-body-section c7n-border-done">
          <div>
            {data && <Ace
              isFileError={!!data.errorLines}
              errorLines={error}
              totalLine={data.totalLine}
              value={data.yaml}
              highlightMarkers={data.highlightMarkers}
              onChange={this.onChange}
            /> }
          </div>
        </div>
      </div>
    </div>);
    return (<Sidebar
      title={intl.formatMessage({ id: 'ist.upgrade' })}
      visible={this.props.visible}
      onOk={this.handleOk}
      onCancel={this.onClose.bind(this, false)}
      cancelText={intl.formatMessage({ id: 'cancel' })}
      okText={intl.formatMessage({ id: 'ist.upgrade' })}
    >
      {sideDom}
    </Sidebar>);
  }
}

export default withRouter(injectIntl(UpgradeIst));
