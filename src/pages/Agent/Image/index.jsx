import React, { useState, useRef } from 'react';
import { withAuth } from '@/components/Auth';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Select, Space, Row, Col, Image, message, Popover, Checkbox, Tag, Upload, Tooltip } from 'antd';
import { PictureOutlined, HighlightOutlined, ColumnWidthOutlined, CloseOutlined } from '@ant-design/icons';
import SendButton from '@/components/SendButton';
import styles from './index.less';

const MODEL_OPTIONS = [
  { label: 'Seedream 4.5', value: 'seedream-4_5' },
  { label: 'Seedream 4.0', value: 'seedream-4_0' },
  { label: '写实摄影', value: 'photo-realistic' },
  { label: '动漫插画', value: 'anime-illustration' },
];

// 比例选项
const RATIO_OPTIONS = [
  { label: '1:1 正方形,头像', value: '1:1' },
  { label: '2:3 社交媒体,自拍', value: '2:3' },
  { label: '3:4 经典比例,拍照', value: '3:4' },
  { label: '4:3 文章配图,插画', value: '4:3' },
  { label: '9:16 手机壁纸,人像', value: '9:16' },
  { label: '16:9 桌面壁纸,风景', value: '16:9' },
];

// 风格选项
const STYLE_OPTIONS = [
  { label: '人像摄影', value: 'portrait' },
  { label: '电影写真', value: 'cinema' },
  { label: '中国风', value: 'chinese' },
  { label: '动漫', value: 'anime' },
  { label: '3D渲染', value: '3d' },
  { label: '赛博朋克', value: 'cyberpunk' },
  { label: 'CG动画', value: 'cg' },
  { label: '水墨画', value: 'ink' },
  { label: '油画', value: 'oil' },
  { label: '古典', value: 'classic' },
  { label: '水彩画', value: 'watercolor' },
  { label: '卡通', value: 'cartoon' },
];

// 示例图片数据（包含不同尺寸，后续会从后端获取）
const SAMPLE_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=400&q=80', height: 300 },
  { url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80', height: 450 },
  { url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80', height: 350 },
  { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80', height: 400 },
  { url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80', height: 320 },
  { url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80', height: 380 },
  { url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=400&q=80', height: 290 },
  { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80', height: 420 },
  { url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80', height: 360 },
  { url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80', height: 340 },
  { url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=400&q=80', height: 310 },
  { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80', height: 390 },
];

const QUICK_ACTIONS = [
  { key: 'ai-photo', label: 'AI 拍图', image: SAMPLE_IMAGES[0].url },
  { key: 'erase', label: '擦除', image: SAMPLE_IMAGES[1].url },
  { key: 'repaint', label: '区域重绘', image: SAMPLE_IMAGES[2].url },
  { key: 'extend', label: '扩图', image: SAMPLE_IMAGES[3].url },
  { key: 'clean', label: '变清晰', image: SAMPLE_IMAGES[4].url },
];

const ImagePage = () => {
  const [model, setModel] = React.useState('seedream-4_5');
  const [prompt, setPrompt] = React.useState('');
  const [selectedRatio, setSelectedRatio] = useState(null);
  const [ratioPopoverVisible, setRatioPopoverVisible] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [stylePopoverVisible, setStylePopoverVisible] = useState(false);
  const [referenceImages, setReferenceImages] = useState([]);
  const [hoverReferenceIndex, setHoverReferenceIndex] = useState(null);
  const [imageColumns, setImageColumns] = useState([[], [], []]); // 三列布局
  const editableRef = useRef(null);
  const imageRefs = useRef({});

  // 处理比例选择
  const handleRatioSelect = (ratio) => {
    setSelectedRatio(ratio);
    setRatioPopoverVisible(false);
  };

  // 处理风格选择
  const handleStyleSelect = (styleValue) => {
    const styleOption = STYLE_OPTIONS.find((opt) => opt.value === styleValue);
    if (!styleOption) return;
    setSelectedStyle(styleOption.label);
    setStylePopoverVisible(false);
  };

  // 处理输入框变化（contentEditable div）
  const handlePromptChange = (e) => {
    const text = e.target.textContent || '';
    // 去除首尾空白字符，如果为空则设置为空字符串
    const trimmedText = text.trim();
    setPrompt(trimmedText);
    
    // 自动调整高度
    if (editableRef.current) {
      editableRef.current.style.height = 'auto';
      const scrollHeight = editableRef.current.scrollHeight;
      const maxHeight = 24 * 6; // 最多6行
      editableRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };
  
  // 处理键盘事件
  const handleKeyDown = (e) => {
    // Enter 发送；Shift + Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
    // Shift + Enter 允许默认行为（换行）
  };
  
  // 处理粘贴事件，只保留纯文本
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      selection.deleteContents();
      const textNode = document.createTextNode(text);
      selection.getRangeAt(0).insertNode(textNode);
      selection.collapseToEnd();
      // 触发输入事件
      const event = new Event('input', { bubbles: true });
      editableRef.current?.dispatchEvent(event);
    }
  };

  // 处理参考图选择（本地选择图片后，仅在输入框上方展示缩略图，不真正上传，最多 5 张）
  const handleReferenceChange = (info) => {
    const fileList = info.fileList || [];
    if (!fileList.length) {
      setReferenceImages([]);
      return;
    }

    let limitedList = fileList;
    if (fileList.length > 5) {
      limitedList = fileList.slice(0, 5);
    }

    const urls = limitedList
      .map((item) => item.originFileObj)
      .filter(Boolean)
      .map((file) => URL.createObjectURL(file));

    setReferenceImages(urls);
  };


  const handleGenerate = () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt && !selectedRatio && !selectedStyle) {
      message.warning('请先描述你想生成的画面~');
      return;
    }
    
    // 组装最终 prompt：风格 + 比例 + 文本
    const parts = [];
    if (selectedStyle) parts.push(`图片风格为：${selectedStyle}`);
    if (selectedRatio) parts.push(`比例：${selectedRatio}`);
    if (cleanPrompt) parts.push(cleanPrompt);
    const finalPrompt = parts.join('，').trim();
    
    console.log('生成 prompt:', finalPrompt);
    message.success('已提交生成任务，稍后将在下方展示结果（示例界面，待接入接口）');
  };

  // 将光标设置到输入框开头
  const setCursorToStart = () => {
    if (editableRef.current) {
      // 使用 requestAnimationFrame 确保在浏览器完成渲染后再设置光标
      requestAnimationFrame(() => {
        if (editableRef.current) {
          const range = document.createRange();
          const selection = window.getSelection();
          if (selection) {
            // 直接设置光标到输入框的开头位置
            range.setStart(editableRef.current, 0);
            range.setEnd(editableRef.current, 0);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      });
    }
  };

  // 初始化 contentEditable div 的高度和光标位置
  React.useEffect(() => {
    if (editableRef.current) {
      // 设置初始固定高度，避免抖动
      editableRef.current.style.height = '24px';
      // 确保内容为空
      editableRef.current.textContent = '';
      // 延迟设置光标，确保 DOM 已完全渲染
      setTimeout(() => {
        setCursorToStart();
      }, 10);
    }
  }, []);

  // 同步 prompt 值到 contentEditable div（仅在外部更新 prompt 时）
  React.useEffect(() => {
    if (editableRef.current) {
      const currentText = (editableRef.current.textContent || '').trim();
      // 只在内容不同时更新，避免用户输入时的冲突
      if (currentText !== prompt) {
        const wasFocused = document.activeElement === editableRef.current;
        // 如果 prompt 为空，清空输入框内容
        editableRef.current.textContent = prompt || '';
        // 调整高度
        editableRef.current.style.height = 'auto';
        const scrollHeight = editableRef.current.scrollHeight;
        const maxHeight = 24 * 6;
        editableRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        // 如果之前是聚焦状态，将光标设置到开头
        if (wasFocused) {
          setCursorToStart();
        }
      }
    }
  }, [prompt]);

  // 瀑布流布局：将图片分配到三列中，每次选择最短的列
  React.useEffect(() => {
    const columns = [[], [], []];
    const columnHeights = [0, 0, 0];

    SAMPLE_IMAGES.forEach((item, index) => {
      // 找到最短的列
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      columns[shortestColumnIndex].push({ ...item, index });
      // 更新列高度（使用预设高度，实际应用中可以从图片加载后获取）
      columnHeights[shortestColumnIndex] += item.height + 12; // 12px是gap
    });

    setImageColumns(columns);
  }, []);


  // 比例菜单内容
  const ratioMenuContent = (
    <div style={{ width: 240, padding: '8px 0' }}>
      <div style={{ padding: '8px 16px', fontSize: 14, color: '#999', borderBottom: '1px solid #f0f0f0' }}>
        比例
      </div>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {RATIO_OPTIONS.map((option) => (
          <div
            key={option.value}
            onClick={() => handleRatioSelect(option.value)}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: selectedRatio === option.value ? '#e6f7ff' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (selectedRatio !== option.value) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedRatio !== option.value) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Checkbox
              checked={selectedRatio === option.value}
              style={{ marginRight: 8 }}
            />
            <span style={{ fontSize: 14, color: selectedRatio === option.value ? '#1890ff' : '#333' }}>
              {option.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // 风格菜单内容
  const styleMenuContent = (
    <div style={{ width: 220, padding: '8px 0' }}>
      <div style={{ padding: '8px 16px', fontSize: 14, color: '#999', borderBottom: '1px solid #f0f0f0' }}>
        风格
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {STYLE_OPTIONS.map((option) => (
          <div
            key={option.value}
            onClick={() => handleStyleSelect(option.value)}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: selectedStyle === option.label ? '#e6f7ff' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (selectedStyle !== option.label) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedStyle !== option.label) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Checkbox
              checked={selectedStyle === option.label}
              style={{ marginRight: 8 }}
            />
            <span style={{ fontSize: 14, color: selectedStyle === option.label ? '#1890ff' : '#333' }}>
              {option.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <PageContainer title={false} className={styles.pageContainer}>
      {/* 顶部居中内容区 */}
      <div className={styles.imagePageRoot}>
        <div className={styles.imagePageTitle}>AI 创作</div>
        <div className={styles.imagePageSubTitle}>自定风格，搜集灵感，复制同款</div>

        {/* 输入框 + 操作行（扁平风格，标签与输入同一行） */}
        <div className={styles.inputWrapper}>
          {referenceImages.length > 0 && (
            <div className={styles.referenceImagesRow}>
              {referenceImages.map((img, index) => (
                <div
                  key={`${img}-${index}`}
                  className={styles.referenceImageItem}
                  onMouseEnter={() => setHoverReferenceIndex(index)}
                  onMouseLeave={() => setHoverReferenceIndex(null)}
                >
                  <Image
                    src={img}
                    alt={`参考图${index + 1}`}
                    width={40}
                    height={40}
                    style={{ borderRadius: 8, objectFit: 'cover' }}
                    preview={false}
                  />
                  {hoverReferenceIndex === index && (
                    <div
                      onClick={() => {
                        setReferenceImages((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                      className={styles.referenceImageRemove}
                    >
                      <CloseOutlined style={{ fontSize: 10, color: '#fff' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={styles.inputMainRow}>
            <div
              ref={editableRef}
              contentEditable
              className={styles.editableInput}
              onInput={handlePromptChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={setCursorToStart}
              onClick={(e) => {
                // 如果点击时输入框为空，将光标设置到开头
                if (!editableRef.current?.textContent || editableRef.current.textContent.trim() === '') {
                  e.preventDefault();
                  setCursorToStart();
                }
              }}
              data-placeholder={prompt ? '' : "描述你所想象的画面，角色，场景，风格..."}
              suppressContentEditableWarning
            />
          </div>

          {/* 标签行：显示在输入框下方 */}
          {(selectedStyle || selectedRatio) && (
            <div className={styles.tagsRow}>
              {selectedStyle && (
                <Tag
                  color="blue"
                  className={styles.styleTag}
                  closable
                  onClose={() => setSelectedStyle(null)}
                >
                  图片风格为：{selectedStyle}
                </Tag>
              )}
              {selectedRatio && (
                <Tag
                  color="processing"
                  className={styles.ratioTag}
                  closable
                  onClose={() => setSelectedRatio(null)}
                >
                  比例：{selectedRatio}
                </Tag>
              )}
            </div>
          )}

          <Row justify="space-between" align="middle" style={{ marginTop: 8 }} gutter={10}>
            <Col>
              <Space size={10} align="center">
                <Tooltip title="最多支持上传 5 张图片">
                  <Upload
                    accept="image/*"
                    multiple
                    showUploadList={false}
                    beforeUpload={() => false}
                    onChange={handleReferenceChange}
                  >
                    <Button
                      icon={<PictureOutlined />}
                      className={styles.actionButton}
                    >
                      参考图
                    </Button>
                  </Upload>
                </Tooltip>
                <Select
                  value={model}
                  onChange={setModel}
                  options={MODEL_OPTIONS}
                  bordered
                  style={{ minWidth: 140 }}
                  dropdownMatchSelectWidth={200}
                />
                <Popover
                  content={ratioMenuContent}
                  trigger="click"
                  open={ratioPopoverVisible}
                  onOpenChange={setRatioPopoverVisible}
                  placement="bottomLeft"
                  overlayStyle={{ paddingTop: 0 }}
                >
                  <Button
                    icon={<ColumnWidthOutlined />}
                      className={styles.actionButton}
                  >
                    比例
                  </Button>
                </Popover>
                <Popover
                  content={styleMenuContent}
                  trigger="click"
                  open={stylePopoverVisible}
                  onOpenChange={setStylePopoverVisible}
                  placement="bottomLeft"
                  overlayStyle={{ paddingTop: 0 }}
                >
                  <Button
                    icon={<HighlightOutlined />}
                      className={styles.actionButton}
                  >
                    风格
                  </Button>
                </Popover>
              </Space>
            </Col>
            <Col>
              <SendButton
                onClick={handleGenerate}
                disabled={!prompt.trim() && !selectedStyle && !selectedRatio}
              />
            </Col>
          </Row>
        </div>

        {/* 快捷操作卡片行：宽度与输入框一致，去除悬浮灰色效果 */}
        <div className={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <div
              key={action.key}
              className={styles.quickActionCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <div className={styles.quickActionLabel}>
                {action.label}
              </div>
              <div className={styles.quickActionImage}>
                <Image
                  src={action.image}
                  alt={action.label}
                  preview={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部瀑布流图片墙 */}
      <div className={styles.galleryWrapper}>
        <div className={styles.masonryGrid}>
          {imageColumns.map((column, colIndex) => (
            <div key={colIndex} className={styles.masonryColumn}>
              {column.map((item) => (
                <div
                  key={`${item.url}-${item.index}`}
                  className={styles.masonryItem}
                  ref={(el) => {
                    if (el) {
                      imageRefs.current[`${item.url}-${item.index}`] = el;
                    }
                  }}
                >
                  <Image
                    src={item.url}
                    alt={`示例图片 ${item.index + 1}`}
                    preview={false}
                    style={{ width: '100%', height: item.height, objectFit: 'cover' }}
                    onLoad={() => {
                      // 图片加载完成后，可以重新计算布局（如果需要）
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default withAuth(ImagePage);
