import { MyIcon } from '@/utils/iconUtil';

let PI = 3.1415926535897932384626;
let a = 6378245.0;
let ee = 0.00669342162296594323;
const waitTime = (seconds) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, seconds * 1000);
  });
};

function wgs84togcj02(lng, lat) {
  if (out_of_china(lng, lat)) {
    return [lng, lat];
  } else {
    let dlat = transformlat(lng - 105.0, lat - 35.0);
    let dlng = transformlng(lng - 105.0, lat - 35.0);
    let radlat = (lat / 180.0) * PI;
    let magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    let sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
    dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);
    let mglat = lat + dlat;
    let mglng = lng + dlng;
    return [mglng, mglat];
  }
}

function out_of_china(lng, lat) {
  return (
    lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271 || false
  );
}

function transformlat(lng, lat) {
  let ret =
    -100.0 +
    2.0 * lng +
    3.0 * lat +
    0.2 * lat * lat +
    0.1 * lng * lat +
    0.2 * Math.sqrt(Math.abs(lng));
  ret +=
    ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
      2.0) /
    3.0;
  ret +=
    ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) /
    3.0;
  ret +=
    ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) *
      2.0) /
    3.0;
  return ret;
}

function transformlng(lng, lat) {
  let ret =
    300.0 +
    lng +
    2.0 * lat +
    0.1 * lng * lng +
    0.1 * lng * lat +
    0.1 * Math.sqrt(Math.abs(lng));
  ret +=
    ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
      2.0) /
    3.0;
  ret +=
    ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) /
    3.0;
  ret +=
    ((150.0 * Math.sin((lng / 12.0) * PI) +
      300.0 * Math.sin((lng / 30.0) * PI)) *
      2.0) /
    3.0;
  return ret;
}

function getDescription() {
  const createMessageElement = (time, text, icon) => {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span>{time}</span>
        <MyIcon type={icon} style={{ fontSize: 15 }} />
        <span>{text}</span>
      </div>
    );
  };

  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) {
    return createMessageElement(
      '早上好',
      '，活力满满，工作顺利！',
      'icon-morning',
    );
  } else if (hour >= 9 && hour < 12) {
    return createMessageElement(
      '上午好',
      '，尽情享受今天的美好时光！',
      'icon-pm',
    );
  } else if (hour >= 12 && hour < 14) {
    return createMessageElement(
      '中午好',
      '，记得好好休息，补充能量哦！',
      'icon-noon',
    );
  } else if (hour >= 14 && hour < 18) {
    return createMessageElement(
      '下午好',
      '，保持专注，高效完成目标！',
      'icon-afternoon',
    );
  } else {
    return createMessageElement(
      '晚上好',
      '，放松身心，享受宁静时光！',
      'icon-evening',
    );
  }
}

export { getDescription, waitTime, wgs84togcj02 };
