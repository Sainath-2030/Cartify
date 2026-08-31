const SIZES = {
  narrow: 'container-narrow',
  focused: 'container-narrow',
  default: 'container-page',
  storefront: 'container-page',
  wide: 'container-wide',
  editorial: 'container-wide',
};

export default function Container({
  children,
  size = 'default',
  className = '',
  as: Component = 'div',
  ...props
}) {
  const sizeClass = SIZES[size] || SIZES.default;
  return (
    <Component className={`${sizeClass} ${className}`} {...props}>
      {children}
    </Component>
  );
}
