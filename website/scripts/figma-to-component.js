#!/usr/bin/env node

/**
 * Figma to React Component Generator
 * 
 * Interactive CLI tool to help convert Figma designs to React components
 * 
 * Usage: node scripts/figma-to-component.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Color mapping
const colorMap = {
  '#1B2951': 'navy',
  '#F7F5F0': 'cream',
  '#B8860B': 'gold',
  '#0066CC': 'linkedin',
  '#2D3748': 'charcoal',
  '#F5F5F4': 'warm-gray',
  '#0f172a': 'vintage-dark',
  '#faf8f3': 'vintage-cream',
  '#d4af37': 'vintage-gold',
  '#0077b5': 'linkedin-blue',
};

// Spacing mapping (px to Tailwind)
const spacingMap = {
  '4': '1',
  '8': '2',
  '12': '3',
  '16': '4',
  '20': '5',
  '24': '6',
  '32': '8',
  '40': '10',
  '48': '12',
  '64': '16',
};

const hexToTailwind = (hex) => {
  const normalized = hex.toUpperCase();
  return colorMap[normalized] || hex;
};

const pxToTailwind = (px) => {
  const value = px.replace('px', '');
  return spacingMap[value] || `[${px}]`;
};

async function generateComponent() {
  console.log('\n🎨 Figma to React Component Generator\n');
  console.log('Let\'s create a new component based on your Figma design!\n');

  // Get component details
  const componentName = await question('Component name (e.g., "FeatureCard"): ');
  const componentType = await question('Component type (component/page): ');
  const description = await question('Brief description: ');

  console.log('\n📏 Design Properties:');
  const width = await question('Width (e.g., "400px", "full"): ');
  const height = await question('Height (e.g., "200px", "auto"): ');
  const bgColor = await question('Background color (hex or name): ');
  const padding = await question('Padding (e.g., "24px"): ');
  const borderRadius = await question('Border radius (e.g., "12px"): ');

  console.log('\n🎯 Typography:');
  const hasHeading = await question('Has heading? (y/n): ');
  let headingSize = '', headingWeight = '', headingText = '';
  if (hasHeading.toLowerCase() === 'y') {
    headingSize = await question('Heading size (e.g., "32px", "2xl", "4xl"): ');
    headingWeight = await question('Heading weight (normal/semibold/bold): ');
    headingText = await question('Heading text: ');
  }

  const hasDescription = await question('Has description text? (y/n): ');
  let descText = '';
  if (hasDescription.toLowerCase() === 'y') {
    descText = await question('Description text: ');
  }

  const hasButton = await question('Has button? (y/n): ');
  let buttonText = '', buttonVariant = '';
  if (hasButton.toLowerCase() === 'y') {
    buttonText = await question('Button text: ');
    buttonVariant = await question('Button variant (default/vintage/outline): ');
  }

  // Generate component
  const componentCode = generateComponentCode({
    componentName,
    description,
    width,
    height,
    bgColor,
    padding,
    borderRadius,
    hasHeading: hasHeading.toLowerCase() === 'y',
    headingSize,
    headingWeight,
    headingText,
    hasDescription: hasDescription.toLowerCase() === 'y',
    descText,
    hasButton: hasButton.toLowerCase() === 'y',
    buttonText,
    buttonVariant,
  });

  // Determine file path
  const fileName = componentName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
  
  const filePath = componentType === 'page'
    ? path.join(__dirname, '../src/app', fileName, 'page.tsx')
    : path.join(__dirname, '../src/components/ui', `${fileName}.tsx`);

  // Show preview
  console.log('\n📝 Generated Component:\n');
  console.log(componentCode);
  console.log(`\n📁 Will be saved to: ${filePath}\n`);

  const save = await question('Save this component? (y/n): ');
  if (save.toLowerCase() === 'y') {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, componentCode);
    console.log(`\n✅ Component saved to ${filePath}`);
    console.log(`\nNext steps:`);
    console.log(`1. Review the generated code`);
    console.log(`2. Import it: import { ${componentName} } from '@/components/ui/${fileName}'`);
    console.log(`3. Use it: <${componentName} />`);
  } else {
    console.log('\nComponent not saved. You can copy the code above.');
  }

  rl.close();
}

function generateComponentCode(props) {
  const {
    componentName,
    description,
    bgColor,
    padding,
    borderRadius,
    hasHeading,
    headingSize,
    headingWeight,
    headingText,
    hasDescription,
    descText,
    hasButton,
    buttonText,
    buttonVariant,
  } = props;

  const bgClass = bgColor.startsWith('#') 
    ? `bg-${hexToTailwind(bgColor)}` 
    : `bg-${bgColor}`;
  
  const paddingClass = padding.includes('px') 
    ? `p-${pxToTailwind(padding)}` 
    : `p-${padding}`;
  
  const radiusClass = borderRadius.includes('px')
    ? `rounded-${pxToTailwind(borderRadius)}`
    : `rounded-${borderRadius}`;

  const sizeMap = {
    '2xl': '2xl',
    '3xl': '3xl',
    '4xl': '4xl',
    '5xl': '5xl',
    '6xl': '6xl',
  };

  const headingSizeClass = headingSize.includes('xl') 
    ? headingSize 
    : sizeMap[headingSize] || '4xl';

  return `import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardContent } from "@/components/ui/card-enhanced"
import { Text } from "@/components/ui/text"
${hasButton ? 'import { Button } from "@/components/ui/button"' : ''}

/**
 * ${componentName}
 * ${description}
 */

interface ${componentName}Props {
  className?: string
  ${hasHeading ? 'title?: string' : ''}
  ${hasDescription ? 'description?: string' : ''}
  ${hasButton ? 'onAction?: () => void' : ''}
}

export function ${componentName}({
  className,
  ${hasHeading ? `title = "${headingText}",` : ''}
  ${hasDescription ? `description = "${descText}",` : ''}
  ${hasButton ? 'onAction,' : ''}
}: ${componentName}Props) {
  return (
    <Card 
      className={cn(
        "${bgClass} ${paddingClass} ${radiusClass} shadow-lg",
        className
      )}
    >
      <CardHeader className="text-center">
        ${hasHeading ? `<Text 
          variant="heading" 
          size="${headingSizeClass}" 
          weight="${headingWeight}" 
          className="text-navy"
        >
          {title}
        </Text>` : ''}
        ${hasDescription ? `<Text variant="lead" className="text-charcoal leading-relaxed mt-4">
          {description}
        </Text>` : ''}
      </CardHeader>
      ${hasButton ? `
      <CardContent className="flex justify-center">
        <Button 
          variant="${buttonVariant}" 
          size="lg"
          onClick={onAction}
        >
          ${buttonText}
        </Button>
      </CardContent>` : ''}
    </Card>
  )
}
`;
}

// Run the generator
generateComponent().catch(console.error);

