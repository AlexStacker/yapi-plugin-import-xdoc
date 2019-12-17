import { message } from 'antd';

function xDoc(importDataModule) {

  function run(res) {
    var parser = new DOMParser();
    try {
      res = parser.parseFromString(res, 'text/html');

      var list = res.querySelectorAll('.title > code');
      var interfaceData = { apis: [] };

      // 页面元素列表
      list.forEach(function (ele) {
        // 默认 .title code 下的为请求url
        // 查找父级.title
        var node = ele.parentElement;
        var text = node.innerText;
        var isUrl = text.trim().match(/^请求地址 *[:：] *(.+)/);

        if (isUrl && isUrl[1]) {
          var api_desc = '';
          var url = isUrl[1];

          // 格式要求需要将接口前缀加 '/'
          if(!url.startsWith('/')) {
            url = '/' + url;
          }

          var title = node.previousElementSibling.innerText;
          // 接口名字
          if(node.previousElementSibling.nodeName !== 'H2') {
            api_desc = title.trim();
            // 默认再上一级是接口名称
            title = node.previousElementSibling.previousElementSibling.innerText;
          }

          var api_desc_arr = title.split('\n');

          // 截取第一个换行为接口名
          // 后面的为接口注释
          if(api_desc_arr.length > 1) {
            title = api_desc_arr.shift().trim();
            api_desc = api_desc + '\n' + api_desc_arr.join('\n').trim();
          }

          var req_query = [];

          var titleNode = node.nextElementSibling;

          // 有参数 将参数取出
          if (/^发送参数/.test(titleNode.innerText.trim())) {
            // params 列表
            var paramsNone = titleNode.nextElementSibling;
            if (paramsNone) {
              for (var index = 0; index < paramsNone.children.length; index++) {
                var element = paramsNone.children[index];
                var name = element.childNodes[0].innerText.trim();
                var desc = element.childNodes[1].nodeValue.trim();
                req_query.push({
                  name: name, // 请求字段名
                  value: '', // 请求值
                  desc: desc // 参数注释
                });
              }
            }

            // 将索引指向下一级返回数据
            titleNode = paramsNone.nextElementSibling;
          }

          // 有响应数据, 放到描述中
          if (/^返回数据/.test(titleNode.innerText.trim())) {
            // params 列表
            var respNode = titleNode.nextElementSibling;

            // 是注释字符串
            if(respNode.nodeName === 'PRE' && respNode.innerText !== '') {
              api_desc = api_desc + '\n' + respNode.outerHTML;
            }
          }

          // 构造需要的数据结构
          var data = {
            path: url,
            title: title,
            method: 'GET',
            req_query: req_query,
            req_body_type: 'json',
            res_body_type: 'json',
            desc: api_desc // 接口描述
          };

          interfaceData.apis.push(data);
        }

      });
      return interfaceData;
    } catch (e) {
      console.error(e);
      message.error('数据格式有误');
    }
  }

  if (!importDataModule || typeof importDataModule !== 'object') {
    console.error('importDataModule 参数必需是一个对象');
    return null;
  }

  importDataModule.xdoc = {
    name: 'xDoc',
    run: run,
    desc: 'xDoc 文档不一定规范, 导入后需要人工核对参数及返回值.'
  };
}

module.exports = function () {
  this.bindHook('import_data', xDoc);
};
