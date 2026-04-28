const axios = require('axios');

// 多维表格配置
const DBSHEET_FILE_ID = 'nJT2QaY261MAwcPf5Y8Prxii7kY1AZMqa';
const DBSHEET_SHEET_ID = '2';

// WPS API配置（从环境变量读取）
const WPS_API_BASE = 'https://openapi.wps.cn';
const WPS_ACCESS_TOKEN = process.env.WPS_ACCESS_TOKEN;

// 字段ID映射
const FIELD_MAP = {
  队伍编号: 'F',
  队伍名称: 'G',
  作品名称: 'H',
  已报名: 'I',
  已完成方案: 'J',
  已完成Demo: 'K',
  已完成演示视频: 'L',
  已提交初赛材料: 'M'
};

// 获取多维表格记录
async function getRecords() {
  try {
    const response = await axios.get(
      `${WPS_API_BASE}/oapi/v1/works/${DBSHEET_FILE_ID}/sheets/${DBSHEET_SHEET_ID}/records`,
      {
        headers: {
          'Authorization': `Bearer ${WPS_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 100
        }
      }
    );
    return response.data.data.items || [];
  } catch (error) {
    console.error('获取记录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 更新多维表格记录
async function updateRecord(recordId, fields) {
  try {
    const response = await axios.put(
      `${WPS_API_BASE}/oapi/v1/works/${DBSHEET_FILE_ID}/sheets/${DBSHEET_SHEET_ID}/records/${recordId}`,
      {
        fields: fields
      },
      {
        headers: {
          'Authorization': `Bearer ${WPS_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('更新记录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 解析记录数据
function parseRecords(records) {
  return records.map(record => {
    const fields = record.fields || {};
    return {
      record_id: record.record_id,
      id: fields[FIELD_MAP.队伍编号],
      num: fields[FIELD_MAP.队伍编号],
      name: fields[FIELD_MAP.队伍名称],
      work: fields[FIELD_MAP.作品名称],
      已报名: fields[FIELD_MAP.已报名] === true,
      已完成方案: fields[FIELD_MAP.已完成方案] === true,
      已完成Demo: fields[FIELD_MAP.已完成Demo] === true,
      已完成演示视频: fields[FIELD_MAP.已完成演示视频] === true,
      已提交初赛材料: fields[FIELD_MAP.已提交初赛材料] === true
    };
  });
}

// Vercel Serverless Function
module.exports = async (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 检查环境变量
  if (!WPS_ACCESS_TOKEN) {
    return res.status(500).json({
      success: false,
      error: 'WPS_ACCESS_TOKEN未配置'
    });
  }

  try {
    // GET请求 - 获取数据
    if (req.method === 'GET') {
      const records = await getRecords();
      const teams = parseRecords(records);
      return res.status(200).json({
        success: true,
        data: teams
      });
    }

    // POST请求 - 更新数据
    if (req.method === 'POST') {
      const { record_id, field, value } = req.body;
      
      if (!record_id || !field) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数'
        });
      }

      const fieldId = FIELD_MAP[field];
      if (!fieldId) {
        return res.status(400).json({
          success: false,
          error: `未知字段: ${field}`
        });
      }

      const fields = { [fieldId]: value };
      await updateRecord(record_id, fields);

      return res.status(200).json({
        success: true,
        message: '更新成功'
      });
    }

    // 其他方法不支持
    return res.status(405).json({
      success: false,
      error: '方法不支持'
    });

  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '服务器内部错误'
    });
  }
};
