# Testing — Unit, Integration, Doc

Rust এ testing built-in — কোনো external framework install করতে হয় না। Python এর `pytest`, C++ এর Google Test — এগুলোর equivalent Rust এ পাওয়া যায় আউট অফ দ্য বক্স। `cargo test` এক command এ সব test run করে।

## Test এর তিন স্তর

| Type | কোথায় | কী test করে |
|------|--------|------------|
| **Unit test** | `src/` এর ভেতর `#[cfg(test)] mod tests` | একটা function/module |
| **Integration test** | `tests/` ফোল্ডার | Public API (একাধিক module একসাথে) |
| **Doc test** | `///` comment এর ভেতর | Code example গুলো |

## Unit Test

### বেসিক Structure

```rust
// src/math.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn divide(a: i32, b: i32) -> Option<i32> {
    if b == 0 {
        None
    } else {
        Some(a / b)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
        assert_eq!(add(-1, 1), 0);
    }

    #[test]
    fn test_add_negative() {
        assert_eq!(add(-5, -3), -8);
    }

    #[test]
    fn test_divide_success() {
        assert_eq!(divide(10, 2), Some(5));
    }

    #[test]
    fn test_divide_by_zero() {
        assert_eq!(divide(10, 0), None);
    }
}
```

> [!note]
> // `#[cfg(test)]` দিয়ে module টা শুধু test এ compile হবে — production binary তে যাবে না। `use super::*` দিয়ে parent module এর সব import করা হয়। এটাই Rust এর standard unit test pattern।

**`#[test]` আসলে কী করে?** Compiler function টাকে test হিসেবে চিহ্নিত করে, আর test harness (libtest) এর collection এ নামসহ register করে। `cargo test` চললে তোমার crate **আলাদা একটা test binary** হয়ে compile হয় — যার নিজস্ব `main()` registered সব test চালায়। প্রতিটা test ভেতরে ভেতরে এমন (simplified):

```rust
// harness এর ভেতরে (simplified)
match std::panic::catch_unwind(test_fn) {
    Ok(_) => println!("ok"),
    Err(_) => println!("FAILED"),   // panic = fail
}
```

মানে test আসলে একটা সাধারণ function — **panic করলেই fail**, এই একটাই নিয়ম। `assert*!` macro গুলো fail করার উপায় `panic!` ছাড়া আর কিছু করে না।

### Run Tests

```bash
cargo test              # সব test
cargo test test_add     # শুধু test_add সম্বলিত গুলো
cargo test -- --nocapture  # println! output দেখাও
cargo test -- --test-threads=1  # sequential (single thread)
```

> [!note]
> **`cargo test` ভেতর থেকে কীভাবে চলে?** Harness default এ **worker thread** তোলে (সংখ্যা = logical core) — প্রতিটা test নিজের আলাদা thread এ চলে। এজন্যই test গুলো পরস্পর-নির্ভর বা shared file/DB ছোঁয়া বিপজ্জনক — `--test-threads=1` দিলে sequential। প্রতিটা test এর `println!` output আলাদা করে ধরা হয় (capture) — pass করলে বাদ, `-- --nocapture` দিলে লাইভ terminal এ স্ট্রিম হয়। `cargo test test_add` এর filter টা test এর **নামের substring** match করে।

## Assertion Macros

```rust
#[test]
fn test_assertions() {
    // Equality
    assert_eq!(2 + 2, 4);
    assert_ne!(2 + 2, 5);

    // Boolean
    assert!(true);
    assert!(5 > 3);

    // Custom message
    assert_eq!(2 + 2, 4, "Math is broken!");

    // Debug message (lazy eval)
    let x = 5;
    assert!(x > 3, "x was {}", x);
}
```

`assert_eq!` এর expansion দেখলে পরিষ্কার (simplified):

```rust
// assert_eq!(add(2, 3), 5) আসলে হয়
{
    match (&add(2, 3), &5) {
        (l, r) if *l == *r => {}   // সমান — pass, কিছুই হয় না
        _ => panic!(
            "assertion `left == right` failed\n  left: {:?}\n right: {:?}",
            l, r
        ),   // সাথে file!(), line!() থেকে location
    }
}
```

এজন্যই দুই পাশের type এ `PartialEq` + `Debug` দুটোই লাগে — failure এ দুই পাশের মান debug format এ ছাপা হয়। তৃতীয় argument এর custom message টা `format_args!` হয়ে panic message এর সাথে জুড়ে যায়।

### `should_panic` — Expected Panic

```rust
pub fn index_element(v: &[i32], i: usize) -> i32 {
    v[i]  // out of bounds হলে panic
}

#[test]
#[should_panic]
fn test_out_of_bounds() {
    index_element(&[1, 2, 3], 99);
}

#[test]
#[should_panic(expected = "index out of bounds")]
fn test_out_of_bounds_message() {
    index_element(&[1, 2, 3], 99);
}
```

> [!tip]
> // `#[should_panic]` দিয়ে test করা যায় function panic করার কথা কিনা। `expected` দিয়ে specific error message match করা যায়।

> [!note]
> **ভেতরে কী ঘটে?** Harness test টাকে `catch_unwind` এ wrap করে চালায় — panic হলে ধরে ফেলে (process মরে না), আর panic message এ `expected = "..."` থাকলে substring match দেখে। panic না হলে বা message মিললে না হলে test fail। খেয়াল: profile এ `panic = "abort"` থাকলে unwinding বন্ধ — `#[should_panic]` তখন কাজ করে না।

### `Result` in Test

```rust
use std::num::ParseIntError;

fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {
    let n: i32 = s.parse()?;
    Ok(n * 2)
}

#[test]
fn test_parse_success() -> Result<(), ParseIntError> {
    let result = parse_and_double("21")?;
    assert_eq!(result, 42);
    Ok(())
}
```

> [!example]
> // Test function ও `Result` return করতে পারে! `?` operator ব্যবহার করা যায় — যদি error হয় test automatically fail হবে। `unwrap()` এর চেয়ে পরিষ্কার।

> [!note]
> ভেতরে আলাদা কোনো জাদু নেই: test function টা `Result` return করলে harness এর হাতে `Err(e)` এলেই সেটা `panic!("{e:?}")` করে দেয় — fail করার প্রক্রিয়া একই, `?` শুধু লেখাটা ছোট করে।

## Integration Test

`tests/` ফোল্ডারে external test:

```
my_project/
├── src/
│   └── lib.rs
└── tests/
    └── api_test.rs     # Integration test
```

```rust
// tests/api_test.rs
use my_project::math::{add, divide};

#[test]
fn test_integration_add() {
    assert_eq!(add(100, 200), 300);
}

#[test]
fn test_integration_divide() {
    assert_eq!(divide(100, 4), Some(25));
    assert_eq!(divide(100, 0), None);
}
```

> [!note]
> // Integration test গুলো `tests/` ফোল্ডারে থাকে। এরা তোমার library এর public API test করে — ঠিক external user এর মতো। Internal private function access নেই। এটা black-box testing।

### Multiple Integration Test Files

```
tests/
├── api_test.rs       # API tests
├── database_test.rs  # Database tests
└── common/
    └── mod.rs        # Shared helper
```

```rust
// tests/common/mod.rs
pub fn setup() -> TestDb {
    // shared setup
}

// tests/database_test.rs
mod common;

#[test]
fn test_db() {
    let db = common::setup();
    // ...
}
```

## Doc Test

Doc comment (`///`) এর ভেতরের code example test হয়:

```rust
/// Adds two numbers.
///
/// # Examples
///
/// ```
/// use my_crate::add;
///
/// let result = add(2, 3);
/// assert_eq!(result, 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

```bash
cargo test              # doc test ও run হয়!
cargo doc --open        # documentation generate আর দেখো
```

> [!tip]
> // Doc test হলো Rust এর অসাধারণ feature — documentation এর কোড example গুলো automatically test হয়! Python এর doctest এর মতো, কিন্তু অনেক বেশি integrated। Documentation যদি outdated হয়, test fail হবে — documentation সবসময় correct থাকবে।

> [!note]
> **Doc test ভেতরে কীভাবে চলে?** `rustdoc` প্রতিটা doc comment এর code block বের করে, প্রতিটার জন্য **আলাদা ছোট crate** বানায় — তোমার snippet টা একটা generated `main()` এর ভেতরে বসে — তারপর সেগুলো compile + run করে। এজন্যই doc test একটু ধীর, কিন্তু `cargo test` এ automatic চলে বলে documentation সহজে পুরনো হয়ে যায় না।

### Ignorable Doc Test

```rust
/// ```no_run
/// use std::fs::File;
/// let f = File::open("foo.txt").unwrap();
/// ```
```

```rust
/// ```ignore
/// let special = generate_special_token();
/// ```
```

| Attribute | কী করে |
|-----------|---------|
| ```` ``` ```` | Normal — compile আর run |
| ```` ```no_run ```` | Compile করো, run করো না |
| ```` ```ignore ```` | একদমই skip |
| ```` ```should_panic ```` | Compile, run, panic expect |
| ```` ```compile_fail ```` | Compile fail expect (error demo) |

## Test Organization

```
src/
├── lib.rs
│   ├── pub fn add() { ... }
│   └── #[cfg(test)]
│       mod tests {
│           // unit test — internal function test
│       }
├── math.rs
│   ├── fn helper() { ... }  // private
│   └── #[cfg(test)]
│       mod tests {
│           // helper() test করা যায় (same module)
│       }
tests/
├── integration.rs
│   // শুধু public API test
└── common/
    └── mod.rs
```

> [!note]
> // Unit test গুলো `src/` এর ভেতরে, private function ও test করতে পারে। Integration test `tests/` এর ভেতরে, শুধু public API test করে। এটাই Rust convention।

## Setup আর Teardown

Rust এ কোনো `setup`/`teardown` function নেই (Python এর fixture এর মতো)। এর বদলে সাধারণ function ব্যবহার করো:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    fn make_test_data() -> Vec<i32> {
        vec![1, 2, 3, 4, 5]
    }

    #[test]
    fn test_sum() {
        let data = make_test_data();
        assert_eq!(data.iter().sum::<i32>(), 15);
    }

    #[test]
    fn test_len() {
        let data = make_test_data();
        assert_eq!(data.len(), 5);
    }
}
```

## Mocking

Rust এ mocking এর জন্য `mockall` crate:

```toml
[dev-dependencies]
mockall = "0.13"
```

```rust
#[cfg(test)]
use mockall::*;

#[automock]
trait Database {
    fn get_user(&self, id: u32) -> Option<String>;
}

fn find_username(db: &dyn Database, id: u32) -> String {
    db.get_user(id).unwrap_or_else(|| "Unknown".to_string())
}

#[test]
fn test_find_username_found() {
    let mut mock_db = MockDatabase::new();
    mock_db
        .expect_get_user()
        .with(eq(1))
        .returning(|_| Some("Karim".to_string()));

    assert_eq!(find_username(&mock_db, 1), "Karim");
}

#[test]
fn test_find_username_not_found() {
    let mut mock_db = MockDatabase::new();
    mock_db
        .expect_get_user()
        .returning(|_| None);

    assert_eq!(find_username(&mock_db, 99), "Unknown");
}
```

> [!example]
> // `mockall` দিয়ে trait mock করা যায়। Database, API client, file system — সব external dependency mock করে test fast আর deterministic হয়। Python এর `unittest.mock` এর মতো।

> [!note]
> `#[automock]` নিজেই একটা **proc-macro** — compile time এ তোমার trait কে নকল করে `MockDatabase` struct + impl generate করে (expectation রাখার field সহ)। মানে mock runtime reflection দিয়ে কাজ করে না — generated আসল code, তাই type-safe আর দ্রুত; Python এর `MagicMock` এর dynamic স্বাধীনতা নেই, বিনিময়ে ভুল হলে compile error।

## Property-Based Testing

`proptest` দিয়ে random input generate করে test:

```toml
[dev-dependencies]
proptest = "1"
```

```rust
proptest! {
    #[test]
    fn test_addition_commutative(a in -1000i32..1000, b in -1000i32..1000) {
        prop_assert_eq!(add(a, b), add(b, a));
    }

    #[test]
    fn test_divide_then_multiply(a in 1i32..1000, b in 1i32..1000) {
        if let Some(q) = divide(a * b, b) {
            prop_assert_eq!(q, a);
        }
    }
}
```

> [!tip]
> // Property-based testing হলো random input দিয়ে property check করা। Python এর Hypothesis এর মতো। Edge case খুঁজে বের করতে দারুণ — manually ভাবা কঠিন edge case গুলো automatic ধরা যায়।

> [!note]
> **`proptest!` এর ভেতরে**: macro random value generate করে test টা অনেকবার চালায় (seed সহ)। Fail পেলে **shrinking** করে — input ছোট করে কমিয়ে সবচেয়ে সরল failing case খোঁজে, আর সেটা `proptest-regressions` ফাইলে রেখে দেয় যাতে পরের run এ সেই case আবার চলে।

## Benchmark Test

```toml
[dev-dependencies]
criterion = "0.5"

[[bench]]
name = "my_benchmark"
harness = false
```

```rust
// benches/my_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci(n: u64) -> u64 {
    match n {
        0 => 1,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn criterion_benchmark(c: &mut Criterion) {
    c.bench_function("fib 20", |b| b.iter(|| fibonacci(black_box(20))));
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
```

```bash
cargo bench
```

> [!note]
> **`black_box` কেন দরকার?** Optimizer দুষ্ট — `fibonacci(20)` এর মান সে compile time এই বের করে ফেলতে পারে। তখন benchmark চলছে ভাবছ, আসলে একটা constant মান বসানো হচ্ছে! `black_box(x)` value টাকে compiler এর চোখে **opaque** করে দেয় (ফাঁকা read/write ঢোকায়), constant-folding বন্ধ হয় — মাপাটা তখন সত্যি runtime এর।

## Test Coverage

```bash
cargo install cargo-tarpaulin
cargo tarpaulin
```

## Python vs Rust — Testing তুলনা

| Feature | Python (pytest) | Rust |
|---------|----------------|------|
| Framework | External install | **Built-in!** |
| Test runner | pytest | `cargo test` |
| Unit test location | `test_*.py` | `#[cfg(test)] mod tests` |
| Integration test | `tests/` folder | `tests/` folder |
| Doctest | `doctest` module | Built-in doc test |
| Fixture | `@pytest.fixture` | Regular function |
| Mock | `unittest.mock` | `mockall` crate |
| Property test | `hypothesis` | `proptest` crate |
| Benchmark | `pytest-benchmark` | `criterion` crate |

> [!note]
> // Rust এর testing সবচেয়ে বড় সুবিধা — সব built-in! `pytest` install করতে হয় না, `doctest` আলাদা চালাতে হয় না। `cargo test` এক command এ unit + integration + doc test সব run হয়।

## Summary

Rust এর testing system সব built-in — unit test (`#[cfg(test)]`), integration test (`tests/`), doc test (`///` comment)। `cargo test` এক command এ সব। Assertion macro গুলো (`assert_eq!`, `assert!`, `should_panic`) powerful। `mockall` আর `proptest` দিয়া আরও advance testing। পরের chapter এ macros দেখবো।