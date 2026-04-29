const axios = require('axios');

const DBSHEET_FILE_ID = 'nJT2QaY261MAwcPf5Y8Prxii7kY1AZMqa';
const DBSHEET_SHEET_ID = 2;
const WPS_API_BASE = 'https://api.wps.cn';
const WPS_APP_ID = process.env.WPS_APP_ID;
const WPS_APP_SECRET = process.env.WPS_APP_SECRET;

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

// 动态获取 Access Token
async function getAccessToken() {
  try {
    const response = await axios.post(
      'https://openapi.wps.cn/oauth2/token',
      `grant_type=client_credentials&client_id=${WPS_APP_ID}&client_secret=${WPS_APP_SECRET}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('获取Token失败:', error.response?.data || error.message);
    throw new Error('获取Access Token失败');
  }
}

async function getRecords(accessToken) {
  try {
    const response = await axios.post(
      `${WPS_API_BASE}/v7/dbsheet/${DBSHEET_FILE_ID}/sheets/${DBSHEET_SHEET_ID}/records`,
      { page_size: 100 },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Origin': 'https://365.kdocs.cn',
          'Referer': 'https://365.kdocs.cn/'
        },
        timeout: 30000
      }
    );
    return response.data?.data?.records || response.data?.records || [];
  } catch (error) {
    console.error('获取记录失败:', error.response?.data || error.message);
    throw error;
  }
}

async function updateRecord(accessToken, recordId, fieldsValue) {
  try {
    const response = await axios.post(
      `${WPS_API_BASE}/v7/dbsheet/${DBSHEET_FILE_ID}/sheets/${DBSHEET_SHEET_ID}/records/batch_update`,
      {
        records: [{ id: recordId, fields_value: JSON.stringify(fieldsValue) }]
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Origin': 'https://365.kdocs.cn',
          'Referer': 'https://365.kdocs.cn/'
        },
        timeout: 30000
      }
    );
    return response.data;
  } catch (error) {
    console.error('更新记录失败:', error.response?.data || error.message);
    throw error;
  }
}

function parseRecords(records) {
  return records.map(record => {
    let fields = {};
    try {
      if (typeof record.fields_value === 'string') {
        fields = JSON.parse(record.fields_value);
      } else if (record.fields) {
        fields = record.fields;
      }
    } catch (e) {
      fields = record.fields || {};
    }
    
    return {
      record_id: record.id || record.record_id,
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!WPS_APP_ID || !WPS_APP_SECRET) {
    return res.status(500).json({ success: false, error: 'WPS_APP_ID 或 WPS_APP_SECRET 未配置' });
  }

  try {
    // 每次请求都获取新 Token（简单可靠）
    const accessToken = await getAccessToken();

    if (req.method === 'GET') {
      const records = await getRecords(accessToken);
      const teams = parseRecords(records);
      return res.status(200).json({ success: true, data: teams });
    }

    if (req.method === 'POST') {
      const { record_id, field, value } = req.body;
      if (!record_id || !field) {
        return res.status(400).json({ success: false, error: '缺少必要参数' });
      }
      const fieldId = FIELD_MAP[field];
      if (!fieldId) {
        return res.status(400).json({ success: false, error: `未知字段: ${field}` });
      }
      await updateRecord(accessToken, record_id, { [fieldId]: value });
      return res.status(200).json({ success: true, message: '更新成功' });
    }

    return res.status(405).json({ success: false, error: '方法不支持' });
  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({ success: false, error: error.message || '服务器内部错误' });
  }
};
