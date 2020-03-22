from django.db import models

# Create your models here.

class Patient(models.Model):
    code = models.IntegerField()
    gender = models.CharField(max_length=5)
    age = models.CharField(max_length=5)
    region = models.CharField(max_length=30)
    confirmed_date = models.DateField(null=True)
    current_status = models.CharField(max_length=100)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    paths = models.TextField(null=True)
    # is_in_hospital = models.BooleanField(default=True)

    def __str__(self):
        return "{}".format(self.code)

class PatientPath(models.Model):
    patient = models.ForeignKey(
        'Patient',
        on_delete=models.CASCADE
    )
    visited_date = models.DateField(null=True)
    place_name = models.CharField(max_length=255,null=True)
    x = models.FloatField(null=True)
    y = models.FloatField(null=True)

class Mask(models.Model):
    addr = models.CharField(max_length=255, null=True)
    code = models.CharField(max_length=255, null=True)
    name = models.CharField(max_length=255, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    stock_at = models.DateTimeField(null=True)
    latitude = models.FloatField(null=True)
    longitude = models.FloatField(null=True)
    remain_stat = models.CharField(max_length=10, null=True)
    place_type = models.CharField(max_length=10, null=True)

class Statistics(models.Model):
    name = models.CharField(max_length=255)
    value = models.IntegerField()
    updated_at = models.DateTimeField(auto_now=True, null=True)