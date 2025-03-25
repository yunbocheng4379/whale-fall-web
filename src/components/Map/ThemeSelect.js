import { Select } from 'antd';

const themeOptions = [
  { value: 'normal', label: '标准' },
  { value: 'dark', label: '幻影黑' },
  { value: 'light', label: '月光银' },
  { value: 'whitesmoke', label: '远山黛' },
  { value: 'fresh', label: '草色青' },
  { value: 'grey', label: '雅士灰' },
  { value: 'graffiti', label: '涂鸦' },
  { value: 'macaron', label: '马卡龙' },
  { value: 'blue', label: '靛青蓝' },
  { value: 'darkblue', label: '极夜蓝' },
  { value: 'wine', label: '酱籽' },
];

const ThemeSelect = ({ value, onChange, style }) => {
  return (
    <Select
      value={value}
      defaultValue="normal"
      style={style}
      onChange={onChange}
      options={themeOptions}
    />
  );
};

export default ThemeSelect;
