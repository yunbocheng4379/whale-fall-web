import React, {useEffect, useRef, useState} from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import './index.less';
import {Button, Input, message, Select, Space, Tooltip} from "antd";
import {isNull, isUndefined} from "lodash";
import {waitTime, wgs84togcj02} from "@/utils/commonUtil";
import {InfoCircleOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined} from "@ant-design/icons";
import ThemeSelect from '@/components/Map/ThemeSelect';

let map
const Map = () => {
  const [themeName, setThemeName] = useState('normal')
  const [searchLoading, setSearchLoading] = useState(false)
  const [isHiddenFooter, setIsHiddenFooter] = useState(false)
  const [personalPosition, setPersonalPosition] = useState()

  const moveEndRef = useRef(null);
  const zoomEndRef = useRef(null);

  let timerId = null

  /* 移动地图 */
  const moveEnd = () => {
    if (timerId)
      clearTimeout(timerId)
    timerId = setTimeout(() => {
      timerId = null
    }, 1000)
  }

  /* 缩放地图 */
  const zoomEnd = () => {
    if (timerId)
      clearTimeout(timerId)
    timerId = setTimeout(() => {
      timerId = null
    }, 1000)
  }


  /* 获取位置信息，构建地图对象 */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const [longitude, latitude] = wgs84togcj02(pos.coords.longitude, pos.coords.latitude)
          setPersonalPosition(`${longitude},${latitude}`)
        }, (e) => {
          switch (e.code) {
            case 1:
              console.log("位置服务被拒绝,请打开权限后刷新此页面!");
              break;
            case 2:
              console.log("暂时获取不到位置信息");
              break;
            case 3:
              console.log("获取位置信息超时");
              break;
            case 4:
              console.log("未知错误");
              break;
          }
        }, {
          timeout: 10000,
          maximumAge: 60000
        }
      )
    } else {
      console.log('浏览器不支持获取用户定位')
    }
    AMapLoader.load({
      key: 'fada029cba5e49027d6f4fe67d0072b0',
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.MarkerCluster', "AMap.HeatMap", "AMap.MouseTool", "AMap.PolygonEditor", "AMap.DistrictSearch"],
    }).then(AMap => {
      map = new AMap.Map('container', {
        zoom: 13,
        center: [116.407387, 39.904179],
        viewMode: '2D',
        mapStyle: 'amap://styles/' + themeName,
        zooms: [4, 20],
        WebGLParams: {preserveDrawingBuffer: true},
        doubleClickZoom: false,
        defaultCursor: "move"
      })
      map.addControl(new AMap.Scale())
      map.on('moveend', moveEnd,)
      moveEndRef.current = moveEnd;
      map.on('zoomend', zoomEnd,)
      zoomEndRef.current = zoomEnd;
    }).catch(e => {
      console.log(e)
    })
  }, [])

  /* 初始化地图(点位，样式) */
  useEffect(() => {
    if (isUndefined(map) || isNull(map))
      return
    map.setMapStyle('amap://styles/' + themeName)
    map.off('moveend', moveEndRef.current);
    map.off('zoomend', zoomEndRef.current);
    moveEndRef.current = moveEnd;
    zoomEndRef.current = zoomEnd;
    map.on('moveend', moveEndRef.current);
    map.on('zoomend', zoomEndRef.current);
    waitTime(0.5).then(() => setSearchLoading(false))
  }, [themeName])

  const HiddenTool = props => {
    return (
      <Button icon={!isHiddenFooter ? <MenuFoldOutlined/> : <MenuUnfoldOutlined/>} onClick={() => {
        setIsHiddenFooter(!isHiddenFooter)
      }}>{!isHiddenFooter ? '折叠工具' : '展开工具'}</Button>
    )
  }

  return (
    <>
      <div style={{maxWidth: '100%', width: '100%', height: window.innerHeight - 60, maxHeight: '100vh'}}>
        <div style={{width: '100%', height: '100%', display: 'flex'}}>
          <div className={'toolbar'}>
            <Space>
              <HiddenTool/>
              <Button
                type={'primary'}
                onClick={() => {
                  message.warning('待开发功能')
                }}>
                测试按钮
              </Button>
              <ThemeSelect
                value={themeName}
                onChange={(item) => setThemeName(item)}
                style={{ width: 120 }}
              />
              <Space.Compact>
                <Input allowClear
                       placeholder={'搜索框'}
                       onChange={(e) => {
                         console.log(e)
                       }}
                />
              </Space.Compact>
              <div>
                <Space.Compact>
                  <Button
                    disabled={searchLoading}
                    icon={<SearchOutlined/>}
                    onClick={() => {
                      message.warning('搜索触发按钮')
                    }}/>
                </Space.Compact>
              </div>
            </Space>
          </div>
          <div id="container" className="map" style={{height: '100%'}}/>
          <div className={'footer'} style={isHiddenFooter ? {display: 'none'} : {}}>
            <Space direction="vertical">
              <div>
                <label style={{color: "grey"}}>区域围栏&nbsp;{
                  <Tooltip placement="top" title={() => {
                    return (
                      <div>
                        <div>使用步骤: 待定</div>
                      </div>
                    )
                  }}>
                    <InfoCircleOutlined />
                  </Tooltip>
                }</label>
                <div style={{marginTop: '10px'}}>
                  <Space>
                    <Button onClick={() => {message.warning('绘制围栏')}}>绘制围栏</Button>
                    <Button onClick={() => {message.warning('数据保存')}}>数据保存</Button>
                  </Space>
                </div>
              </div>
            </Space>
          </div>
        </div>
      </div>
    </>
  )
}

export default Map;
