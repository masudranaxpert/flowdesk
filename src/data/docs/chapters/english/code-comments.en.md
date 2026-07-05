# Writing Code Comments and Documentation

Listen to this — **code explains WHAT, comments explain WHY**. What does that mean? When you read the code, you can understand what is happening — what each function does. But comments explain why it is doing that.

`x = x + 1` — from the code you can see that 1 is being added to x. But **why** is 1 being added? That is written in a comment. Today we will learn how to write code comments and documentation in English.

## Why Are Comments Important?

If you work alone, you might feel comments are not needed. But when you work in a team — or look at your own code after 6 months — you will realize how important comments are.

Here are some benefits of good comments:

```
1. Other developers will quickly understand your logic
2. Six months later, you yourself will understand why you did it that way
3. Bug fixes will take less time
4. Code reviews will be easier
5. It helps new developers during onboarding
```

> [!important] Golden Rule
> **Code = WHAT (what is happening), Comment = WHY (why it is happening)**. If a comment only explains WHAT — remove it. If it explains WHY — keep it.

## Types of Comments

### Inline Comment

A comment placed at the end of a line or next to it. Used for short explanations.

The inline comment below explains why +1 was added — this is a good comment:

```python
# Page numbers start from 0, but users see from 1
current_page = api_page + 1
```

Without this comment, someone might wonder "why +1?". Now it is clear — users need to see pages starting from 1, but the API starts from 0.

### Block Comment

A detailed explanation spanning multiple lines. Used before complex logic.

The block comment below explains the context of the whole function — why this approach was chosen:

```python
# This function uses binary search instead of linear search
# because the product list is always sorted by price.
# Performance: O(log n) vs O(n) for large catalogs.
def find_product(products, target_id):
    left, right = 0, len(products) - 1
    while left <= right:
        mid = (left + right) // 2
        if products[mid].id == target_id:
            return products[mid]
        elif products[mid].id < target_id:
            left = mid + 1
        else:
            right = mid - 1
    return None
```

Without the comment, someone might wonder why binary search is used. The comment explains — the product list is always sorted, so binary search is faster.

## Python Docstrings

In Python, docstrings are used to write detailed documentation for functions, classes, or modules. There are two popular styles.

### Google Style Docstring

The docstring below is in Google style — it is the most clear and readable:

```python
def calculate_discount(price, discount_percent):
    """Calculate the final price after applying discount.

    Args:
        price (float): Original price of the product.
        discount_percent (float): Discount percentage (0-100).

    Returns:
        float: Final price after discount.

    Raises:
        ValueError: If discount_percent is not between 0 and 100.
    """
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("discount_percent must be between 0 and 100")
    return price - (price * discount_percent / 100)
```

Here `Args` lists the parameters, `Returns` shows the return value, and `Raises` describes the exceptions. Very clear.

### NumPy Style Docstring

The docstring below is in NumPy style — more common in scientific projects:

```python
def calculate_discount(price, discount_percent):
    """
    Calculate the final price after applying discount.

    Parameters
    ----------
    price : float
        Original price of the product.
    discount_percent : float
        Discount percentage (0-100).

    Returns
    -------
    float
        Final price after discount.

    Raises
    ------
    ValueError
        If discount_percent is not between 0 and 100.
    """
```

NumPy style uses underlines to separate sections. Scientific libraries (pandas, numpy) use this format.

## JSDoc (JavaScript)

In JavaScript, JSDoc is used for documentation. Editors (like VS Code) read JSDoc to show autocomplete and type hints.

The JSDoc below clearly describes the type of each parameter and the return value:

```javascript
/**
 * Calculate the final price after applying discount.
 * @param {number} price - Original price of the product.
 * @param {number} discountPercent - Discount percentage (0-100).
 * @returns {number} Final price after discount.
 * @throws {Error} If discountPercent is not between 0 and 100.
 */
function calculateDiscount(price, discountPercent) {
    if (discountPercent < 0 || discountPercent > 100) {
        throw new Error("discountPercent must be between 0 and 100");
    }
    return price - (price * discountPercent / 100);
}
```

`@param` describes parameters, `@returns` describes the return value, and `@throws` describes exceptions. This is the standard for JavaScript documentation.

## What to Comment and What Not to Comment

### What You Should Comment

| Type | English Example | Meaning |
|------|----------------|---------|
| **Business logic** | `# Apply 15% tax for non-residents` | 15% tax for non-residents |
| **Workaround** | `# Workaround for iOS Safari bug #1234` | A fix for an iOS Safari bug |
| **TODO** | `# TODO: refactor this to use async/await` | Refactor using async/await later |
| **FIXME** | `# FIXME: this breaks on large inputs` | Breaks on large inputs, needs fixing |
| **HACK** | `# HACK: temporary fix until API v2 is ready` | Temporary fix until API v2 arrives |
| **Note** | `# Note: this assumes the input is sorted` | Assumes the input is already sorted |
| **Warning** | `# Warning: do NOT modify this order` | Do not change this order |

### What You Should Not Comment

> [!important] Do Not Write These Comments
> Commenting on things that are already obvious from the code — this is noise, not help. It causes harm.

The comments below are completely meaningless — you can already tell from the code:

```python
i += 1  # increment i by 1         ← why? you can see it from the code!
name = input()  # get user name     ← why? the function name says it all
return result  # return the result  ← why?? this is obvious!
print("Hello")  # print hello       ← really? who knew!
```

These comments are nothing but noise. Remove them.

## Common Comment Phrases

Some phrases appear again and again in documentation and code comments. Knowing them makes writing comments easier.

You will see these phrases repeatedly in documentation, tutorials, and code comments:

| English Phrase | Meaning | When to Use |
|----------------|---------|-------------|
| **This handles the case when...** | This handles the case when... | To explain a special case |
| **Workaround for a bug in...** | A temporary fix for a bug in... | To describe a temporary fix |
| **TODO: refactor this to...** | Need to do ... later | To remind yourself of future work |
| **FIXME: this breaks on...** | This breaks on... | To mark a known issue |
| **Note: this assumes...** | It is assumed that... | To describe an assumption |
| **This is a temporary solution...** | This is a temporary solution | To indicate it is not permanent |
| **Warning: do NOT modify...** | Warning: do not modify | To highlight something dangerous |
| **This prevents...** | This prevents... | To explain what issue is being avoided |

## Before / After: Without Comments vs With Comments

Look at the code below — without comments, it is impossible to understand what is happening:

This code has no comments — you cannot tell why `* 0.85` is being done:

```python
def calc(price, qty):
    total = price * qty
    if total > 1000:
        total = total * 0.85
    return total
```

What is `0.85`? Why `1000`? Nothing makes sense. Now look at the same code with comments:

The same code with comments — now it is clear that orders above 1000 get a 15% discount:

```python
def calculate_total(price, quantity):
    """Calculate total price with bulk discount.

    If total exceeds 1000, apply 15% discount.
    """
    total = price * quantity

    # Bulk discount: 15% off for orders over 1000
    if total > 1000:
        total = total * 0.85

    return total
```

Now it is clear — `0.85` means a 15% discount, `1000` is the bulk order threshold. This is a good comment.

## README Writing Basics

Every project has a README.md file. This is the face of your project. When someone looks at your project on GitHub, the README is the first thing they read.

A good README has these sections:

Here is the basic structure of a README — each section's name and what it contains:

```markdown
# Project Name

Short description of what this project does.

## Installation
```bash
npm install my-project
```

## Usage
```javascript
import { myFunction } from 'my-project';
myFunction();
```

## Features
- Feature 1
- Feature 2

## License
MIT
```

Each section's purpose: **Description** = what the project does, **Installation** = how to install it, **Usage** = how to use it, **Features** = what you get, **License** = which license.

> [!tip] The Most Important Part of a README
> **Description and Usage example** — these two are the most important. People decide whether to use your project based on these two alone.

## Key Takeaways

- Code explains **WHAT**, comments explain **WHY**
- Use **TODO/FIXME/HACK** markers to highlight known issues
- In Python use **Google style docstrings**, in JavaScript use **JSDoc** — these are the standards
- Do not write obvious comments (`i += 1  # increment`) — it only adds noise
- A README must have **description, installation, usage, examples** — all four