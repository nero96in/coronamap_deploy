from django.contrib import admin
from .models import Patient, PatientPath, Mask, Statistics

# Register your models here.

class PatientPathAdmin(admin.ModelAdmin):
    list_display = ('patient', 'place_name', 'visited_date', 'x', 'y')

class PatientAdmin(admin.ModelAdmin):
    list_display = ('code', 'gender', 'age', 'region', 'confirmed_date', 'current_status', 'updated_at')

class MaskAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'addr', 'remain_stat', 'stock_at', 'updated_at', 'place_type', 'latitude', 'longitude')

class StatisticsAdmin(admin.ModelAdmin):
    list_display = ('name', 'value', 'updated_at')

admin.site.register(Patient, PatientAdmin)
admin.site.register(PatientPath, PatientPathAdmin)
admin.site.register(Mask, MaskAdmin)
admin.site.register(Statistics, StatisticsAdmin)