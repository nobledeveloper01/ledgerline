from django.db import models


class Timestamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class Customer(models.Model):
    email = models.CharField(max_length=254, unique=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(null=True)


class Product(models.Model):
    sku = models.CharField(max_length=32)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'catalogue_product'


class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    invoice = models.OneToOneField('Invoice', on_delete=models.PROTECT, null=True)
    products = models.ManyToManyField(Product)
    placed_at = models.DateTimeField()

    class Meta:
        unique_together = (('customer', 'placed_at'),)


class Invoice(models.Model):
    reference = models.UUIDField()
    owner = models.ForeignKey('auth.User', on_delete=models.CASCADE)


class Legacy(models.Model):
    thing = models.CharField(max_length=10)

    class Meta:
        managed = False
