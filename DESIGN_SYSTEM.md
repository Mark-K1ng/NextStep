# NextStep Design System

Strict design system rules for spacing, padding, corner roundness, and squircle implementation.

## Overview

This design system enforces strict rules to ensure visual consistency across all screens and components. All rectangular containers use squircle (Apple-style rounded corners) for a polished, modern look.

## Spacing Rules

### Content Spacing (within containers)

- **xs (4px)**: Tightly packed elements (icon + text in buttons)
- **sm (8px)**: Related elements (label + input, badge spacing)
- **md (12px)**: Default spacing between form fields
- **lg (16px)**: Standard spacing between major sections
- **xl (24px)**: Large spacing between distinct content areas
- **xxl (32px)**: Very large spacing (hero sections)
- **xxxl (48px)**: Extra large spacing (hero content)

### Padding (container interiors)

- **Small components** (buttons, chips): `md (12px)` horizontal, `sm (8px)` vertical
- **Cards**: `lg (16px)` all around
- **Sections**: `lg (16px)` horizontal, `lg (16px)` vertical
- **Screens**: `lg (16px)` all around (SafeAreaView handles notch spacing)
- **Modals**: `xl (24px)` all around (SafeAreaView handles notch spacing)
- **Auth screens**: `xl (24px)` all around

## Corner Roundness Rules

### Standard Radius

- **sm (8px)**: Small elements (badges, tags, icons)
- **md (12px)**: Interactive elements (buttons, inputs, small cards)
- **lg (16px)**: Large containers (cards, modals, main UI blocks)
- **xl (24px)**: Full squircle for pills and round elements

### Squircle Usage

**ALL rectangular containers use squircle corners:**
- Cards (all sizes)
- Buttons (all variants)
- Inputs (all types)
- Search bars
- Checkboxes
- List items
- Settings items
- Modals
- Progress bars
- Timeline markers
- Any rectangular container

Squircle is implemented using the native `borderCurve: 'continuous'` prop on iOS 13+ and falls back gracefully on older versions and Android.

## Component Rules

### Button
- **Padding**: `lg (16px)` horizontal, `md (12px)` vertical
- **Radius**: `md (12px)`
- **Squircle**: Always applied
- **Min height**: 44px
- **No overrides allowed**

### Card
- **Padding**: `lg (16px)` all around
- **Radius**: `md (12px)`
- **Squircle**: Always applied
- **No overrides allowed**

### Input
- **Padding**: `md (12px)` horizontal, `sm (8px)` vertical
- **Radius**: `md (12px)`
- **Squircle**: Always applied
- **Min height**: 44px
- **No overrides allowed**

### SearchBar
- **Padding**: `md (12px)` horizontal, `sm (8px)` vertical
- **Radius**: `lg (16px)` (larger for search)
- **Squircle**: Always applied
- **No overrides allowed**

### CheckboxGroup
- **Item spacing**: `sm (8px)` between items
- **Item padding**: `sm (8px)` horizontal, `sm (8px)` vertical
- **Item radius**: `md (12px)`
- **Checkbox radius**: `sm (8px)`
- **Squircle**: Always applied to items and checkboxes
- **No overrides allowed**

### CategoryPills
- **Padding**: `lg (16px)` horizontal, `sm (8px)` vertical
- **Radius**: `xl (24px)` (full squircle for pills)
- **Squircle**: Always applied
- **No overrides allowed**

### ListItem
- **Padding**: `lg (16px)` all around
- **Radius**: `lg (16px)` (larger for list items)
- **Squircle**: Always applied
- **Badge radius**: `sm (8px)`
- **No overrides allowed**

### SettingsItem
- **Padding**: `lg (16px)` all around
- **Radius**: `md (12px)`
- **Squircle**: Always applied
- **No overrides allowed**

### SectionHeader
- **Margin bottom**: `lg (16px)`
- **No margin overrides allowed**

### Timeline
- **Milestone spacing**: `xl (24px)` between milestones
- **Marker size**: 24px (12px radius)
- **Line width**: 2px
- **Squircle**: Always applied to markers
- **No spacing/size overrides allowed**

### SkillComparison
- **Card padding**: `lg (16px)`
- **Column gap**: `lg (16px)`
- **Progress bar height**: 8px
- **Progress bar radius**: `sm (8px)`
- **Dot size**: 16px (8px radius)
- **Squircle**: Always applied to progress bar and dots
- **No spacing overrides allowed**

## Screen Spacing Rules

### Home Screen
- **Content padding**: `lg (16px)`
- **Section spacing**: `xl (24px)` between sections
- **Quick action gap**: `md (12px)`

### Explore Screen
- **Content padding**: `lg (16px)`
- **No custom spacing** (components handle it)

### Path Screen
- **Content padding**: `lg (16px)`
- **No custom spacing** (components handle it)

### Recommendations Screen
- **Content padding**: `lg (16px)`
- **No custom spacing** (components handle it)

### Profile Screen
- **Content padding**: `lg (16px)`
- **No custom spacing** (components handle it)

### Modal Screens
- **Content padding**: `xl (24px)` (larger for modals)
- **No custom spacing** (components handle it)

### Auth Screens
- **Content padding**: `xl (24px)` (larger for auth forms)
- **Form field spacing**: `lg (16px)` between fields
- **No custom spacing** (components handle it)

## Strict Enforcement Policy

### Component-Level Enforcement
- All padding values are hardcoded (no props to override)
- All radius values are hardcoded (no props to override)
- Squircle is applied by default (cannot disable)
- Any style props that could violate rules are removed

### Screen-Level Enforcement
- Content padding values are hardcoded
- Section spacing values are hardcoded
- Only standardized components are used
- No inline styles that violate spacing rules

### Exceptions
- Only documented exceptions in this file are allowed
- Any new exception must be approved and documented here
- No undocumented exceptions permitted

## Implementation Notes

### Squircle Implementation
Squircle is implemented using the native `borderCurve: 'continuous'` prop:
- iOS 13+: Native squircle support (zero overhead)
- Older iOS: Falls back to standard circular corners
- Android: Falls back to standard circular corners
- TypeScript: Uses `@ts-ignore` for borderCurve (iOS-only prop)

### Cross-Platform Notes
The native `borderCurve` property provides squircle on iOS 13+ but not on Android. For true cross-platform squircle (iOS + Android GPU-accelerated), the library `react-native-continuous-corners` (~30KB) can be added if needed. Currently, Android users will see standard circular corners, which is acceptable for the MVP.

## Usage Examples

### Button (Correct)
```tsx
<Button title="Click me" onPress={handlePress} />
```

### Card (Correct)
```tsx
<Card>
  <Text>Content</Text>
</Card>
```

### Input (Correct)
```tsx
<Input label="Email" placeholder="nume@exemplu.com" value={email} onChangeText={setEmail} />
```

### Spacing (Correct)
```tsx
<View style={{ marginBottom: spacing.lg }}>
  <Text>Section</Text>
</View>
```

### ❌ DO NOT
```tsx
// Do not override padding
<Button title="Click" style={{ padding: 20 }} />

// Do not override radius
<Card style={{ borderRadius: 20 }} />

// Do not use arbitrary spacing
<View style={{ marginBottom: 15 }} />
```

## Verification

Before declaring any task complete, verify:
1. ✅ All components follow spacing rules
2. ✅ All components follow radius rules
3. ✅ All rectangular containers have squircle
4. ✅ No component has custom padding that violates rules
5. ✅ No screen has arbitrary spacing values
6. ✅ Design system is consistent across all screens

## Maintenance

When adding new components:
1. Follow the spacing rules from this document
2. Apply squircle to all rectangular containers
3. Hardcode padding and radius values
4. No override props for spacing/radius
5. Update this document with the new component rules

When modifying existing components:
1. Check if modification violates any rule
2. If yes, do not make the modification
3. If necessary, document exception here first
4. Get approval before proceeding
