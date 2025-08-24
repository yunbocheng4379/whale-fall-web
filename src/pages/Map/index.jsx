import React, {useEffect, useRef, useState} from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import './index.less';
import {Button, Input, message, Select, Space, Tooltip} from "antd";
import {isNull, isUndefined} from "lodash";
import {waitTime, wgs84togcj02} from "@/utils/commonUtil";
import {InfoCircleOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined} from "@ant-design/icons";
import ThemeSelect from '@/components/Map/ThemeSelect';
import Joyride, { STATUS, EVENTS } from 'react-joyride';

let map
const Map = () => {
  const [themeName, setThemeName] = useState('normal')
  const [searchLoading, setSearchLoading] = useState(false)
  const [isHiddenFooter, setIsHiddenFooter] = useState(false)
  const [personalPosition, setPersonalPosition] = useState()
  const [tourSteps, setTourSteps] = useState([]);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [showTour, setShowTour] = useState(false);

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
  const zoomEnd = () => {3
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

      // 默认打开引导
      setShowTour(true)
      setTourStepIndex(0);
      initializeTourSteps();
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
      <Button
        className="smart-replenish-btn"
        icon={!isHiddenFooter ? <MenuFoldOutlined/> : <MenuUnfoldOutlined/>}
        onClick={() => {
          setIsHiddenFooter(!isHiddenFooter)
        }}
      >{!isHiddenFooter ? '折叠工具' : '展开工具'}
      </Button>
    )
  }

  // 初始化引导步骤
  const initializeTourSteps = () => {
    setTourSteps([
      {
        target: '.smart-replenish-btn',
        content: '点击"智能补仓"按钮，系统将为您打开智能分析菜单，帮助您进行智能化的电池补仓决策',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.position-mode-radio-group',
        content: '在智能补仓菜单中，选择绘制模式：\n1. 补取模式：用于补充和获取电池\n2. 推荐模式：系统推荐的优化方案\n3. 新电池模式：新电池的部署方案',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.region-select',
        content: '选择指定的大区，系统将根据大区信息进行区域化的分析和推荐',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.battery-group-select',
        content: '选择具体的电池分组，系统会根据分组信息进行智能分析和推荐',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.draw-button',
        content: '点击"绘制"按钮，系统将根据您选择的模式和参数，在指定位置绘制相应的点位信息',
        placement: 'bottom',
        disableBeacon: true,
      }
    ]);
  };

  // 手动关闭引导
  const closeTour = () => {
    setShowTour(false);
    setTourStepIndex(0);
    setTourSteps([]);
  };

  // 引导事件处理
  const handleTourEvent = (data) => {
    const { action, index, status, type } = data;
    // 处理所有关闭操作
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      closeTour();
      return;
    }
    if (type === EVENTS.STEP_AFTER) {
      if (index === 0) {
        setShowTour(true);
        setTourStepIndex(1);
      }
    }
    // 处理步骤跳转
    if (type === EVENTS.STEP_AFTER && action === 'next') {
      // 下一步
      if (index < tourSteps.length - 1) {
        const nextStep = index + 1;
        setTourStepIndex(nextStep);
      } else {
        closeTour();
      }
    } else if (type === EVENTS.STEP_AFTER && action === 'prev') {
      // 上一步
      if (index > 0) {
        const prevStep = index - 1;
        setTourStepIndex(prevStep);
      }
    }
  }

  return (
    <>
      {/* 引导组件 */}
      <Joyride
        steps={tourSteps}
        run={showTour}
        stepIndex={tourStepIndex}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={handleTourEvent}
        disableOverlayClose={true}
        hideCloseButton={true}
        showCloseButton={false}
        spotlightClicks={false}
        disableScrolling={false}
        scrollToFirstStep={true}
        scrollOffset={100}
        disableOverlay={false}
        floaterProps={{
          disableAnimation: false,
          hideArrow: false,
        }}
        styles={{
          options: {
            primaryColor: '#1890ff',
            zIndex: 10000,
            arrowColor: '#fff',
          },
          tooltip: {
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: '350px',
            minWidth: '300px',
          },
          tooltipContent: {
            whiteSpace: 'pre-line',
            lineHeight: '1.6',
          },
          buttonNext: {
            backgroundColor: '#1890ff',
            borderRadius: '6px',
            border: 'none',
            color: '#fff',
            padding: '8px 16px',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: 'none'
          },
          buttonBack: {
            color: '#666',
            marginRight: 5,
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
          },
          buttonSkip: {
            color: '#999',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
        locale={{
          back: '上一步',
          last: '完成',
          next: '下一步',
          skip: '跳过'
        }}
      />
      <div style={{maxWidth: '100%', width: '100%', height: window.innerHeight - 60, maxHeight: '100vh'}}>
        <div style={{width: '100%', height: '100%', display: 'flex'}}>
          <div className={'toolbar'}>
            <Space>
              <HiddenTool/>
              <Button
                className="position-mode-radio-group"
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
                <Input
                  allowClear
                  className="region-select"
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
                    <Button
                      className="battery-group-select"
                      onClick={() => {
                        message.warning('绘制围栏')
                      }}>
                      绘制围栏
                    </Button>
                    <Button
                      className="draw-button"
                      onClick={() => {
                        message.warning('数据保存')
                      }}>
                      数据保存
                    </Button>
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
