from sqlalchemy import Column, ForeignKey, Integer, String, Numeric, DateTime, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class TimestampMixin:
    created_at = Column(DateTime, nullable=False)


class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True)
    email = Column(String(254), nullable=False, unique=True)
    balance = Column(Numeric(12, 2))
    orders = relationship('Order', back_populates='customer')


class Order(Base):
    __tablename__ = 'orders'
    __table_args__ = (UniqueConstraint('customer_id', 'reference', name='uq_order_ref'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey('customers.id'), nullable=False)
    reference: Mapped[str] = mapped_column(String(32))
    cancelled: Mapped[bool] = mapped_column(Boolean, nullable=True)
    note = Column('order_note', String(120))


class Shipment(Base):
    __tablename__ = 'shipments'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'))
    carrier = Column(String)
