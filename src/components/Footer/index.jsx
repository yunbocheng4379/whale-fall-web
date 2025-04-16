const Footer = () => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '15px',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: '15px',
        backgroundColor: 'transparent',
        zIndex: 999,
      }}
    >
      <a
        href="http://www.beian.gov.cn"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#000000' }}
      >
        京公网安备 1234567890号
      </a>
    </div>
  );
};

export default Footer;
