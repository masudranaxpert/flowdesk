# Code Comment ও Documentation লেখা

একটা কথা শোনো — **code বোঝায় WHAT, comment বোঝায় WHY**। মানে কী? কোড পড়লে বোঝা যায় কী হচ্ছে — কোন function টা কী করছে। কিন্তু comment বোঝায় কেন সেটা করছে।

`x = x + 1` — কোড দেখে বোঝা যাচ্ছে x এর সাথে ১ যোগ হচ্ছে। কিন্তু **কেন** যোগ হচ্ছে? সেটা comment এ লেখা থাকে। আজ শিখবো কীভাবে English এ code comment আর documentation লেখা যায়।

## কেন Comment করা জরুরি?

তুমি একা কাজ করলে হয়তো মনে হবে comment দরকার নেই। কিন্তু team এ কাজ করলে — অথবা ৬ মাস পর নিজের code দেখলে — বুঝবে comment কতো জরুরি।

ভালো comment এর কিছু উপকারিতা নিচে দেওয়া হলো:

```
১. অন্য developer দ্রুত বুঝবে তোমার logic
২. ৬ মাস পর তুমি নিজেই বুঝবে কেন এমন করেছিলে
৩. Bug fix করার সময় কম সময় লাগবে
৪. Code review সহজ হবে
৫. Onboarding এ নতুন developer দের সাহায্য হবে
```

> [!important] Golden Rule
> **Code = WHAT (কী হচ্ছে), Comment = WHY (কেন হচ্ছে)**। যদি comment এ শুধু WHAT বোঝাচ্ছে — সেটা বাদ দাও। WHY বোঝাচ্ছে — সেটা রাখো।

## Comment এর ধরন

### Inline Comment

এক line এর শেষে বা পাশে দেওয়া comment। ছোট explanation এর জন্য।

নিচের inline comment টা বোঝাচ্ছে কেন +1 করা হয়েছে — এটাই ভালো comment:

```python
# Page numbers start from 0, but users see from 1
current_page = api_page + 1
```

এখানে comment টা না থাকলে কেউ ভাবতো "+1 কেন?"। এখন পরিষ্কার — user দের 1 থেকে দেখাতে হবে কিন্তু API 0 থেকে শুরু।

### Block Comment

কয়েক line এর বিস্তারিত explanation। Complex logic এর আগে দেওয়া হয়।

নিচের block comment টা পুরো function এর context বোঝাচ্ছে — কেন এই approach নেওয়া হয়েছে:

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

এখানে comment না থাকলে কেউ ভাবতে পারে কেন binary search। Comment এ বোঝানো আছে — product list সবসময় sorted, তাই binary search দ্রুত।

## Python Docstring

Python এ function, class, বা module এর বিস্তারিত documentation লেখার জন্য docstring ব্যবহার করা হয়। দুটো popular style আছে।

### Google Style Docstring

নিচের docstring টা Google style এর — সবচেয়ে পরিষ্কার আর readable:

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

এখানে `Args` এ parameter গুলো, `Returns` এ return value, আর `Raises` এ exception গুলো বোঝানো আছে। খুব পরিষ্কার।

### NumPy Style Docstring

নিচের docstring টা NumPy style এর — scientific project এ বেশি দেখা যায়:

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

NumPy style এ underline দিয়ে section আলাদা করা হয়। Scientific library গুলো (pandas, numpy) এই format ই ব্যবহার করে।

## JSDoc (JavaScript)

JavaScript এ JSDoc ব্যবহার করা হয় documentation এর জন্য। Editor গুলো (VS Code) JSDoc দেখেই autocomplete আর type hint দেখায়।

নিচের JSDoc টা প্রতিটা parameter আর return value এর type স্পষ্টভাবে বোঝাচ্ছে:

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

`@param` দিয়ে parameter, `@returns` দিয়ে return value, `@throws` দিয়ে exception বোঝানো হয়। এটাই JavaScript documentation এর standard।

## কী Comment করবে, কী করবে না

### যা Comment করবে

| Type | English Example | বাংলা অর্থ |
|------|----------------|-----------|
| **Business logic** | `# Apply 15% tax for non-residents` | non-resident দের জন্য ১৫% tax |
| **Workaround** | `# Workaround for iOS Safari bug #1234` | iOS Safari এর bug এর সমাধান |
| **TODO** | `# TODO: refactor this to use async/await` | পরে async/await দিয়ে refactor করতে হবে |
| **FIXME** | `# FIXME: this breaks on large inputs` | বড় input এ সমস্যা হয়, ঠিক করতে হবে |
| **HACK** | `# HACK: temporary fix until API v2 is ready` | API v2 আসা পর্যন্ত অস্থায়ী সমাধান |
| **Note** | `# Note: this assumes the input is sorted` | input sorted ধরে নেওয়া হয়েছে |
| **Warning** | `# Warning: do NOT modify this order` | এই order পরিবর্তন করবে না |

### যা Comment করবে না

> [!important] এই Comment গুলো করবে না
> কোড থেকেই স্পষ্ট জিনিস comment করা — এটা noise, সাহায্য না, ক্ষতি।

নিচের comment গুলো একদমই অর্থহীন — code দেখেই বোঝা যাচ্ছে:

```python
i += 1  # increment i by 1         ← কেন? কোড দেখেই বোঝা যাচ্ছে!
name = input()  # get user name     ← কেন? function এর নামেই সব বোঝা যাচ্ছে
return result  # return the result  ← কেন?? এটা তো obvious!
print("Hello")  # print hello       ← সত্যি? কে জানতো!
```

এই comment গুলো noise ছাড়া কিছু না। সরিয়ে দাও।

## Common Comment Phrase

Documentation আর code comment এ বারবার কিছু phrase দেখা যায়। এগুলো জানলে comment লেখা সহজ হয়।

নিচের phrase গুলো documentation, tutorial, code comment — সব জায়গায় বারবার দেখবে:

| English Phrase | বাংলা অর্থ | কখন ব্যবহার |
|----------------|-----------|------------|
| **This handles the case when...** | এটা যখন... সেই case handle করে | কোনো special case বোঝাতে |
| **Workaround for a bug in...** | ... এর bug এর অস্থায়ী সমাধান | temporary fix বোঝাতে |
| **TODO: refactor this to...** | পরে ... করতে হবে | পরে কাজ করতে হবে মনে করিয়ে দিতে |
| **FIXME: this breaks on...** | ... এ সমস্যা হয় | known issue চিহ্নিত করতে |
| **Note: this assumes...** | ধরে নেওয়া হয়েছে যে... | assumption বোঝাতে |
| **This is a temporary solution...** | এটা অস্থায়ী সমাধান | permanent fix না বোঝাতে |
| **Warning: do NOT modify...** | সতর্কতা: পরিবর্তন করবে না | বিপজ্জনক জিনিস হাইলাইট করতে |
| **This prevents...** | এটা ... ঠেকায় | কোনো সমস্যা এড়াতে |

## Before / After: Comment ছাড়া vs Comment সহ

নিচের code টা দেখো — comment ছাড়া একদম বোঝা যাচ্ছে না কী হচ্ছে:

এই code টা comment ছাড়া — কেন `* 0.85` করা হয়েছে, সেটা একদমই বোঝা যাচ্ছে না:

```python
def calc(price, qty):
    total = price * qty
    if total > 1000:
        total = total * 0.85
    return total
```

`0.85` কী? কেন `1000`? কিছুই বোঝা যাচ্ছে না। এখন একই code comment সহ দেখো:

একই code comment সহ — এখন পরিষ্কার যে ১০০০ টাকার উপরে ১৫% discount দেওয়া হয়:

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

এখন পরিষ্কার — `0.85` মানে ১৫% discount, `1000` মানে bulk order threshold। এটাই ভালো comment।

## README লেখার Basic

প্রত্যেক project এ একটা README.md ফাইল থাকে। এটাই তোমার project এর মুখ। GitHub এ কেউ project দেখলে প্রথমে README ই পড়ে।

একটা ভালো README এ এই section গুলো থাকে:

নিচে README এর basic structure দেখানো হলো — প্রতিটা section এর নাম আর কী থাকবে সেটা বোঝানো আছে:

```markdown
# Project Name

Short description of what this project does.

## Installation
\`\`\`bash
npm install my-project
\`\`\`

## Usage
\`\`\`javascript
import { myFunction } from 'my-project';
myFunction();
\`\`\`

## Features
- Feature 1
- Feature 2

## License
MIT
```

প্রতিটা section এর কাজ: **Description** = প্রজেক্ট কী করে, **Installation** = কীভাবে install করবে, **Usage** = কীভাবে ব্যবহার করবে, **Features** = কী কী পাবে, **License** = কোন লাইসেন্স।

> [!tip] README এর সবচেয়ে গুরুত্বপূর্ণ অংশ
> **Description আর Usage example** — এই দুটো সবচেয়ে গুরুত্বপূর্ণ। মানুষ এই দুটো দেখেই ঠিক করে তোমার project ব্যবহার করবে কি না।

## মূল যেটা মনে রাখবে

- Code বোঝায় **WHAT**, comment বোঝায় **WHY**
- **TODO/FIXME/HACK** marker ব্যবহার করো known issue চিহ্নিত করতে
- Python এ **Google style docstring**, JavaScript এ **JSDoc** — এই দুটো standard
- Obvious comment (`i += 1  # increment`) করবে না — শুধু noise বাড়ে
- README তে **description, installation, usage, examples** — এই চারটা অবশ্যই থাকবে