# Unit & Integration Testing: JUnit 5 ও Mockito

সফটওয়্যার ইঞ্জিনিয়ারিংয়ে টেস্ট ছাড়া কোড লেখা মানে অন্ধকারের মধ্যে গাড়ি চালানো। জাভা ইকোসিস্টেমে নির্ভরযোগ্য সফটওয়্যার ডেভেলপমেন্টের জন্য **JUnit 5 (Jupiter)** এবং **Mockito** ইন্ডাস্ট্রি স্ট্যান্ডার্ড।

---

## ১. Testing Pyramid ও JUnit 5 আর্কিটেকচার

টেস্টিং পিরামিডের মূল নীতি হলো: প্রচুর দ্রুতগতির ইউনিট টেস্ট, পর্যাপ্ত ইন্টিগ্রেশন টেস্ট এবং সামান্য কিছু এন্ড-টু-এন্ড (E2E) টেস্ট।

```
          / \
         / E2E \       (Slow, Expensive, Few)
        /───────\
       / Integr. \     (Testcontainers, DB, Medium)
      /───────────\
     /    Unit     \   (JUnit 5, Mockito, Super Fast, Many)
    /───────────────\
```

JUnit 5 মূলত তিনটি মডিউলের সমন্বয়:
- **JUnit Platform**: টেস্ট এক্সিকিউট করার ফাউন্ডেশন (IDE ও বিল্ড টুলসের জন্য)।
- **JUnit Jupiter**: আধুনিক প্রোগ্রামিং মডেল ও এক্সটেনশন মডেল (`@Test`, `@ParameterizedTest`)।
- **JUnit Vintage**: পুরনো JUnit 3/4 টেস্ট ব্যাকওয়ার্ড কম্প্যাটিবিলিটিতে রান করার জন্য।

---

## ২. JUnit 5 কোর ফিচার ও লাইফসাইকেল

```java
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("Bank Account Unit Tests")
class BankAccountTest {

    private BankAccount account;

    @BeforeEach
    void setUp() {
        account = new BankAccount("ACC-100", 500.0);
    }

    @AfterEach
    void tearDown() {
        account = null;
    }

    @Test
    @DisplayName("Deposit should increment account balance accurately")
    void shouldDepositSuccessfully() {
        account.deposit(200.0);
        assertEquals(700.0, account.getBalance(), 0.001, "Balance must be exactly 700");
    }

    @Test
    @DisplayName("Withdrawal exceeding balance should throw InsufficientFundsException")
    void shouldThrowWhenWithdrawingTooMuch() {
        assertThrows(InsufficientFundsException.class, () -> {
            account.withdraw(600.0);
        });
    }

    @ParameterizedTest(name = "Deposit {0} should result in balance {1}")
    @CsvSource({
        "100.0, 600.0",
        "250.0, 750.0",
        "500.0, 1000.0"
    })
    void shouldHandleMultipleDeposits(double depositAmount, double expectedBalance) {
        account.deposit(depositAmount);
        assertEquals(expectedBalance, account.getBalance(), 0.001);
    }

    @Test
    @DisplayName("Grouped assertions: verify multiple properties together")
    void testGroupedAssertions() {
        assertAll("Account Properties",
            () -> assertEquals("ACC-100", account.getAccountId()),
            () -> assertEquals(500.0, account.getBalance(), 0.001)
        );
    }
}
```

> [!TIP]
> `assertAll()` ব্যবহার করলে ভেতরে থাকা কোনো একটি অ্যাসার্শন ফেইল করলেও বাকিগুলো এক্সিকিউট হয় এবং সব ফেইলিউরের বিস্তারিত একবারে রিপোর্টে দেখায়।

---

## ৩. Mockito: মকিং ও ডিপেন্ডেন্সি আইসোলেশন

ইউনিট টেস্টের সময় এক্সটার্নাল সার্ভিস, ডাটাবেস বা থার্ড পার্টি API কল এড়াতে Mockito দিয়ে সেই ডিপেন্ডেন্সিগুলোর ডামি বা মক তৈরি করা হয়।

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderService orderService; // Injects mock gateway and repository

    @Captor
    private ArgumentCaptor<Order> orderCaptor;

    @Test
    void shouldProcessOrderSuccessfully() {
        // Arrange
        Order inputOrder = new Order("ORD-1", 150.0, "PENDING");
        when(paymentGateway.charge(150.0)).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        boolean result = orderService.checkout(inputOrder);

        // Assert
        assertEquals(true, result);
        
        // Verify payment gateway was called exactly once
        verify(paymentGateway, times(1)).charge(150.0);

        // Verify state passed to repository using ArgumentCaptor
        verify(orderRepository).save(orderCaptor.capture());
        Order savedOrder = orderCaptor.getValue();
        assertEquals("PAID", savedOrder.getStatus());
    }
}
```

---

## ৪. Integration Testing: Testcontainers

আগে ইন্টিগ্রেশন টেস্টে ইন-মেমোরি H2 ডাটাবেস ব্যবহার করা হতো, কিন্তু প্রোডাকশন PostgreSQL বা MySQL-এর ডায়ালেক্ট ও ফিচারের সাথে H2-এর অমিল থাকায় গোপন বাগ তৈরি হতো। আধুনিক জাভায় **Testcontainers** ডকার কন্টেইনারের মাধ্যমে রিয়েল ডাটাবেসে টেস্ট চালায়।

```java
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;

import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class RealDatabaseIntegrationTest {

    // Automatically pulls and runs real postgres in Docker
    @Container
    private static final PostgreSQLContainer<?> postgres = 
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpass");

    @Test
    void testRealPostgresConnection() throws Exception {
        assertTrue(postgres.isRunning());

        try (Connection conn = DriverManager.getConnection(
                postgres.getJdbcUrl(),
                postgres.getUsername(),
                postgres.getPassword())) {

            ResultSet rs = conn.createStatement().executeQuery("SELECT 1");
            assertTrue(rs.next());
            System.out.println("Verified on real PostgreSQL container!");
        }
    }
}
```

> [!NOTE]
> Testcontainers টেস্ট রান করার শুরুতে ডকার কন্টেইনার চালু করে এবং টেস্ট শেষ হলে `Ryuk` কন্টেইনারের সাহায্যে সবকিছু স্বয়ংক্রিয়ভাবে ক্লিন করে ফেলে।
