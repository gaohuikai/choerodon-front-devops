import React, { Component, Fragment } from 'react';
import { observer } from 'mobx-react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Content, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import { Button, Form, Select, Input, Modal, Icon, Table } from 'choerodon-ui';
import '../../../main.scss';
import './KeyValueSideBar.scss';
import EnvOverviewStore from "../../../../stores/project/envOverview";

const { AppState } = stores;
const { Sidebar } = Modal;
const { Item: FormItem } = Form;
const { Option } = Select;
const { TextArea } = Input;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 26 },
  },
};

const EditableContext = React.createContext();

const EditableRow = ({ form, index, ...props }) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends Component {
  state = {
    editing: false,
    pasting: false,
    oldValue: '',
  };

  componentDidMount() {
    if (this.props.editable) {
      document.addEventListener('click', this.handleClickOutside, true);
    }
  }

  componentWillUnmount() {
    if (this.props.editable) {
      document.removeEventListener('click', this.handleClickOutside, true);
    }
  }

  toggleEdit = () => {
    const editing = !this.state.editing;
    this.setState({ editing }, () => {
      if (editing) {
        this.input.focus();
      }
    });
  };

  handleClickOutside = (e) => {
    const { editing } = this.state;
    if (editing && this.cell !== e.target && !this.cell.contains(e.target)) {
      this.save();
    }
  };

  save = () => {
    const { record, handleSave } = this.props;
    this.form.validateFields((error, values) => {
      if (error) {
        return;
      }
      this.toggleEdit();
      if (values.key === '') {
        record.keys = '';
      }
      handleSave({ ...record, ...values });
    });
  };

  onChange = (e) => {
    const { handleAdd } = this.props;
    const { oldValue, pasting } = this.state;
    if (pasting) {
      const value = oldValue !== '' ? (e.target.value.split(oldValue)[1] || e.target.value) : e.target.value;
      if (value.indexOf('=') > -1) {
        const kVlaue = [];
        _.map(value.split('\n'), s => {
          if (s) {
            kVlaue.push(s.split('=').map(a => a.trim()));
          }
        });
        this.save();
        handleAdd(kVlaue);
      }
    }
    this.setState({ pasting: false })
  };

  onKeyDown = (e) => {
    if (e.keyCode === 86 && (e.ctrlKey || e.metaKey)) {
      this.setState({ pasting: true, oldValue: e.target.value });
    }
  };

  checkKey = (rule, value, callback) => {
    const { intl } = this.props;
    const pattern = /[^0-9A-Za-z\.\-\_]/;
    if (pattern.test(value) && rule.field === 'key') {
      callback(intl.formatMessage({ id: "configMap.keyRule" }));
    } else {
      callback();
    }
  };

  render() {
    const { editing } = this.state;
    const {
      editable,
      dataIndex,
      record,
      intl,
      ...restProps
    } = this.props;
    return (
      <td ref={node => (this.cell = node)} {...restProps}>
        {editable ? (
          <EditableContext.Consumer>
            {(form) => {
              this.form = form;
              return (
                editing ? (
                  <FormItem style={{ margin: 0 }}>
                    {form.getFieldDecorator(dataIndex, {
                      initialValue: record[dataIndex],
                      rules: [
                        {
                          validator: this.checkKey,
                        },
                      ],
                    })(
                      <TextArea
                        label={intl.formatMessage({ id: dataIndex })}
                        ref={node => (this.input = node)}
                        autosize
                        onKeyDown={this.onKeyDown}
                        onChange={this.onChange}
                      />
                    )}
                  </FormItem>
                ) : (
                  <TextArea
                    autosize
                    label={intl.formatMessage({ id: dataIndex })}
                    className="editable-cell-value-wrap"
                    onClick={this.toggleEdit}
                    onFocus={this.toggleEdit}
                    value={restProps.children.filter(a => typeof(a) === 'string')}
                  />
                )
              );
            }}
          </EditableContext.Consumer>
        ) : restProps.children}
      </td>
    );
  }
}

@observer
class KeyValueSideBar extends Component {

  /**
   * 检查名称唯一性
   * @param rule
   * @param value
   * @param callback
   */
  checkName = _.debounce((rule, value, callback) => {
    const { intl, store, form } = this.props;
    const { id } = AppState.currentMenuType;
    const pattern = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
    const envId = form.getFieldValue("envId");
    if (value && !pattern.test(value)) {
      callback(intl.formatMessage({ id: "network.name.check.failed" }));
    } else if (value && pattern.test(value)) {
      store.checkName(id, envId, value)
        .then((data) => {
          if (data && data.failed) {
            callback(formatMessage({ id: 'template.checkName' }));
          } else {
            callback();
          }
        })
        .catch((error) => {
          Choerodon.prompt(error.response.data.message);
        });
    } else {
      callback();
    }
  }, 1000);

  constructor(props) {
    super(props);
    this.columns = [{
      title: 'key',
      dataIndex: 'key',
      width: 230,
      editable: true,
    }, {
      title: '',
      width: 60,
      className: 'icon-equal',
      align: 'center',
      dataIndex: 'temp',
    }, {
      title: 'value',
      width: 230,
      dataIndex: 'value',
      editable: true,
    }, {
      title: '',
      dataIndex: 'operation',
      render: (text, record) => (
        this.state.dataSource.length >= 1 ? (<Icon className="del-btn" type="delete" onClick={this.handleDelete.bind(this, record.keys)} />) : null),
    }];

    this.state = {
      dataSource: [{
        keys: '0',
        key: '',
        temp: '=',
        value: '',
      }],
      count: 1,
      submitting: false,
      warningDisplay: false,
      warningMes: '',
      data: false,
    };
  }

  componentDidMount() {
    const { id: projectId } = AppState.currentMenuType;
    const { store, id } = this.props;
    EnvOverviewStore.loadActiveEnv(projectId);
    if (typeof(id) === 'number') {
      store.loadCmById(projectId, id)
        .then((data) => {
          if (data && data.failed) {
            Choerodon.prompt(data.message);
          } else {
            let temp = [];
            _.map(Object.entries(data.value), d => {
              temp.push({
                keys: d[0],
                key: d[0],
                temp: '=',
                value: d[1],
              })
            });
            this.setState({ data, dataSource: temp });
          }
        })
    }
  }

  /**
   * 环境选择
   * @param value
   */
  handleEnvSelect = (value) => {
    const { store } = this.props;
    const { id: projectId } = AppState.currentMenuType;
    store.loadConfigMap(projectId, value);
    EnvOverviewStore.setTpEnvId(value);
  };

  handleDelete = (key) => {
    const dataSource = [...this.state.dataSource];
    this.setState({ dataSource: dataSource.filter(item => item.keys !== key) });
  };

  handleAdd = (addData) => {
    const { count, dataSource } = this.state;
    let newData = [];
    if (addData.length) {
      addData.map(a => {
        newData.push({
          keys: a[0],
          key: a[0],
          temp: '=',
          value: a[1],
        })
      });
    } else {
      newData.push({
        keys: count,
        key: '',
        temp: '=',
        value: '',
      })
    }
    const data = _.uniqBy([...dataSource.filter(item => item.keys !== ''), ...newData], 'keys');
    this.setState({
      dataSource: data,
      count: count + newData.length,
    });
  };

  handleSave = (row) => {
    const newData = [...this.state.dataSource];
    const index = newData.findIndex(item => row.keys === item.keys);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    this.setState({ dataSource: newData });
  };

  handleSubmit = e => {
    e.preventDefault();
    const { form, store, intl: { formatMessage }, id } = this.props;
    const { dataSource } = this.state;
    const { id: projectId } = AppState.currentMenuType;
    this.setState({ submitting: true, warningDisplay: false });
    const pattern = /[^0-9A-Za-z\.\-\_]/;
    const noKey = dataSource.filter(item => item.key === '');
    const hasKey = dataSource.filter(item => item.key !== '');
    const onlyValue = noKey.filter(item => item.value !== '');
    const onlyKey = hasKey.filter(item => item.value === '');
    const errLength = onlyKey.concat(onlyValue).length;

    if (errLength) {
      this.setState({
        warningMes: formatMessage({ id: "configMap.keyValueSpan" }),
        warningDisplay: true,
        submitting: false,
      });
    } else if (hasKey.length !== _.uniqBy(hasKey, 'key').length) {
      this.setState({
        warningMes: formatMessage({ id: "configMap.keyRepeat" }),
        warningDisplay: true,
        submitting: false,
      });
    } else if (hasKey.map(k => pattern.test(k.key)).indexOf(true) > -1) {
      this.setState({
        warningMes: formatMessage({ id: "configMap.keyRuleSpan" }),
        warningDisplay: true,
        submitting: false,
      });
    } else {
      const datas = _.uniqBy([...dataSource.filter(item => item.key !== '')], 'keys');
      form.validateFieldsAndScroll((err, data) => {
        if (!err) {
          const temp = {};
          _.map(datas, d => {
            temp[d['key']] = d['value'];
          });
          const devopsConfigMapDTO = {
            name: data.name,
            description: data.description,
            envId: data.envId,
            type: id ? 'update' : 'create',
            id: id || undefined,
            value: temp,
          };
          store.postConfigMap(projectId, devopsConfigMapDTO)
            .then((res) => {
              if (res) {
                if (res && res.failed) {
                  this.setState({ submitting: false });
                  Choerodon.prompt(res.message);
                } else {
                  this.setState({ submitting: false });
                  this.handleClose();
                }
              }
            });
        }
      });
    }
  };

  /**
   * 关闭弹框
   */
  handleClose = (isload = true) => {
    const { onClose } = this.props;
    onClose(isload);
  };

  getFormContent = () => {
    const {
      intl: { formatMessage },
      form: { getFieldDecorator },
      envId,
      id,
    } = this.props;
    const { data } = this.state;
    const envData = EnvOverviewStore.getEnvcard;

    return (<Form className="c7n-sidebar-form" layout="vertical">
      <FormItem {...formItemLayout}>
        {getFieldDecorator("envId", {
          initialValue: envData.length ? envId : null,
          rules: [
            {
              required: true,
              message: formatMessage({ id: "required" }),
            },
          ],
        })(
          <Select
            disabled={Boolean(id)}
            className="c7n-select_512"
            label={<FormattedMessage id="ctf.envName" />}
            placeholder={formatMessage({
              id: "ctf.env.placeholder",
            })}
            optionFilterProp="children"
            onSelect={this.handleEnvSelect}
            filterOption={(input, option) =>
              option.props.children[1]
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0
            }
            filter
            showSearch
          >
            {_.map(envData, item => {
              const { id, connect, name } = item;
              return (
                <Option key={id} value={id} disabled={!connect}>
                  {connect ? (
                    <span className="c7ncd-status c7ncd-status-success" />
                  ) : (
                    <span className="c7ncd-status c7ncd-status-disconnect" />
                  )}
                  {name}
                </Option>
              );
            })}
          </Select>
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('name', {
          initialValue: data ? data.name : null,
          rules: [{
            required: true,
            message: formatMessage({ id: 'required' }),
          }, {
            validator: id ? null : this.checkName,
          }],
        })(
          <Input
            disabled={Boolean(id)}
            maxLength={10}
            label={<FormattedMessage id="app.name" />}
          />,
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('description', {
          initialValue: data ? data.description : null,
        })(
          <TextArea
            autosize={{ minRows: 2 }}
            maxLength={30}
            label={<FormattedMessage id="configMap.des" />}
          />,
        )}
      </FormItem>
    </Form>);
  };

  render() {
    const { visible, intl, id, envId } = this.props;
    const { submitting, dataSource, warningDisplay, warningMes, data } = this.state;
    const envData = EnvOverviewStore.getEnvcard;
    const envName = _.find(envData, ["id", envId]).name;
    const title = id ? data.name : envName;
    const components = {
      body: {
        row: EditableFormRow,
        cell: EditableCell,
      },
    };
    const columns = this.columns.map((col) => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave,
          handleAdd: this.handleAdd,
          intl,
        }),
      };
    });

    return (
      <div className="c7n-region">
        <Sidebar
          destroyOnClose
          cancelText={<FormattedMessage id="cancel" />}
          okText={id ? <FormattedMessage id="save" /> : <FormattedMessage id="create" />}
          title={id ? <FormattedMessage id="configMap.edit" /> : <FormattedMessage id="configMap.create" />}
          visible={visible}
          onOk={this.handleSubmit}
          onCancel={this.handleClose.bind(this, false)}
          confirmLoading={submitting}
        >
          <Content
            code={id ? 'configMap.edit' : 'configMap.create'}
            values={{ name: title }}
            className="c7n-ctf-create sidebar-content"
          >
            {this.getFormContent()}
            <Table
              filterBar={false}
              showHeader={false}
              pagination={false}
              components={components}
              className="editable"
              dataSource={dataSource}
              columns={columns}
              rowKey={record => record.keys}
            />
            <Button icon="add" onClick={this.handleAdd} type="primary">
              <FormattedMessage id="configMap.add" />
            </Button>
            {warningDisplay ? <div className="c7n-cm-warning">{warningMes}</div> : null}
          </Content>
        </Sidebar>
      </div>
    );
  }
}

export default Form.create({})(injectIntl(KeyValueSideBar));