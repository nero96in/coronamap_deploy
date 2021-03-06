# Generated by Django 3.0.4 on 2020-03-09 14:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='place',
            name='latitude',
            field=models.FloatField(null=True),
        ),
        migrations.AlterField(
            model_name='place',
            name='longitude',
            field=models.FloatField(null=True),
        ),
        migrations.AlterField(
            model_name='place',
            name='visited_date',
            field=models.DateField(null=True),
        ),
    ]
