const Button = ({
  type = "button",
  onClick,
  className = "",
  children,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        "w-full rounded-lg bg-farm-green-dark px-4 py-2.5 font-semibold text-white transition",
        "hover:bg-farm-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-green/40",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
