// CSS Module type declarations
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Regular CSS file type declarations
declare module '*.css' {
  const content: string;
  export default content;
}

