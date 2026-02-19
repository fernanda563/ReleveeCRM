
## Fix: Responsive Padding and Spacing in Steps 2 and 3 of the New Order Modal

### Problem Analysis

After inspecting the code in `src/components/orders/OrderDialog.tsx`, two classes of problems were found:

**Problem 1 — Missing inner padding on mobile**

The `DialogContent` uses `mx-0 rounded-none` on mobile (full-width modal), but the form and its step containers have no horizontal padding. On a 390px screen, the content runs edge-to-edge with no breathing room. The `<form>` and each step `<div className="space-y-4">` need explicit `px-1` or `px-0` on mobile (the `DialogContent` itself already has `p-6` from the shadcn default, but that needs to be verified and normalized for mobile).

**Problem 2 — Broken indentation structure in Steps 2 and 3**

The previous responsive refactor changed grid classes but inadvertently left the inner `<div className="space-y-2">` for the first field in each step at a misaligned indentation level relative to its parent `<div className="space-y-4">`. This means:

- In **Step 2**: The "Tipo de Metal" field's `<Label>` and `<Select>` are children of a `<div className="space-y-2">` but that div is not properly closed before the conditional gold fields grid — causing visual spacing inconsistency.
- In **Step 3**: Same pattern — the "Tipo de Piedra" field hangs outside its natural `space-y-4` flow.

**Problem 3 — DialogContent padding on mobile**

The `DialogContent` has Tailwind class `p-6` by default (from the shadcn component). On mobile with `mx-0 rounded-none`, this p-6 gives 24px of padding on each side, which should be fine. However, the issue may be that the `max-h-[90vh] overflow-y-auto` clips content on short screens combined with the stepper taking up vertical space. The stepper on mobile needs compact spacing.

### Technical Changes in `src/components/orders/OrderDialog.tsx`

**1. DialogContent — normalize padding for mobile (line 931)**
Add `sm:p-6 p-4` override to reduce the default padding slightly on narrow screens, giving fields more horizontal space.

**2. Step 2 block — fix structure (lines 1436–1492)**

The first `<div className="space-y-2">` wrapping the "Tipo de Metal" field is indented incorrectly and its closing `</div>` is misplaced. Restructure so that:
- The outer `<div className="space-y-4">` contains properly indented children
- Each field group (`space-y-2`) is a direct, consistently indented child

**3. Step 3 block — fix structure (lines 1494–1675)**

Same fix as Step 2: the "Tipo de Piedra" `<div className="space-y-2">` needs proper indentation and its closing tag placed correctly so the diamond specs block and the observations block are siblings at the same level inside `space-y-4`.

**4. Navigation buttons — add mobile spacing (around line 2010)**
The footer buttons row needs `mt-4 pt-4` to ensure it doesn't crowd the last form field on mobile.

**5. Stepper (mobile) — tighten spacing (line 992)**
Change `mb-6` to `mb-4` on the mobile stepper container to reclaim vertical space.

### Summary of Files Changed

- **`src/components/orders/OrderDialog.tsx`**: Fix DialogContent padding, restructure Steps 2 and 3 inner divs for correct indentation and spacing, tighten mobile stepper margin.
