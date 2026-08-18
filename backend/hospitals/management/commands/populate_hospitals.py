import random
from django.core.management.base import BaseCommand
from hospitals.models import Hospital, Alert

INDIAN_CITIES = [
    'Chennai', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad',
    'Kolkata', 'Pune', 'Ahmedabad', 'Kochi', 'Jaipur',
    'Chandigarh', 'Coimbatore', 'Lucknow', 'Thiruvananthapuram', 'Indore'
]

HOSPITAL_CHAINS = [
    'Apollo Hospital', 'Fortis Healthcare', 'Manipal Hospital', 'Max Super Speciality',
    'Yashoda Hospital', 'Narayana Health', 'Aster Medcity', 'Gleneagles Global',
    'Medanta Medicity', 'KIMS Hospital', 'Columbia Asia', 'Artemis Hospital',
    'Lilavati Hospital', 'Breach Candy Hospital', 'Kokilaben Dhirubhai Ambani Hospital',
    'VPS Lakeshore', 'MIOT International', 'Kauvery Hospital', 'SIMS Hospital', 'Amrita Hospital'
]

class Command(BaseCommand):
    help = 'Populates the database with 90 initial mock hospitals matching frontend mock design'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing existing records...')
        Hospital.objects.all().delete()
        Alert.objects.all().delete()

        hospitals_to_create = []
        
        self.stdout.write('Generating 90 initial mock hospitals...')
        for i in range(1, 91):
            padded_id = f"HOSP{i:06d}"
            chain = HOSPITAL_CHAINS[(i - 1) % len(HOSPITAL_CHAINS)]
            city = INDIAN_CITIES[(i - 1) % len(INDIAN_CITIES)]
            name = f"{chain}, {city}"

            status = 'healthy'
            delay_minutes = 0
            service_status = 'running'
            data_quality = int(92 + random.random() * 8)
            data_volume_mb = int(80 + random.random() * 100)
            records_received = int(8000 + random.random() * 12000)
            aws_cost = int(800 + random.random() * 1200)

            if i == 23:
                status = 'critical'
                delay_minutes = 240
                service_status = 'stopped'
                data_quality = 45
                data_volume_mb = 12
                records_received = 950
                aws_cost = 350
            elif i == 41:
                status = 'offline'
                delay_minutes = 310
                service_status = 'stopped'
                data_quality = 0
                data_volume_mb = 0
                records_received = 0
                aws_cost = 120
            elif i == 12:
                status = 'warning'
                delay_minutes = 95
                service_status = 'degraded'
                data_quality = 78
                data_volume_mb = 45
                records_received = 3400
                aws_cost = 610
            elif i == 67:
                status = 'warning'
                delay_minutes = 80
                service_status = 'degraded'
                data_quality = 82
                data_volume_mb = 58
                records_received = 4200
                aws_cost = 740
            elif i == 84:
                status = 'critical'
                delay_minutes = 190
                service_status = 'degraded'
                data_quality = 52
                data_volume_mb = 22
                records_received = 1500
                aws_cost = 420
            elif i == 89:
                status = 'warning'
                delay_minutes = 110
                service_status = 'degraded'
                data_quality = 74
                data_volume_mb = 38
                records_received = 2900
                aws_cost = 530
            elif i % 7 == 0 and len([h for h in hospitals_to_create if h.status == 'delayed']) < 12:
                status = 'delayed'
                delay_minutes = 35 + ((i * 3) % 25)
                service_status = 'running'
                data_quality = int(85 + random.random() * 8)
                data_volume_mb = int(60 + random.random() * 40)
                records_received = int(5000 + random.random() * 4000)
                aws_cost = int(700 + random.random() * 400)

            # Generate last data received time
            current_hour = 12
            current_min = 2
            total_current_min = current_hour * 60 + current_min
            last_min_total = total_current_min - delay_minutes
            last_hour = int((last_min_total / 60) % 24)
            last_min = int(abs(last_min_total) % 60)
            period = 'PM' if last_hour >= 12 else 'AM'
            display_hour = 12 if last_hour % 12 == 0 else last_hour % 12
            last_data_received = f"{display_hour:02d}:{last_min:02d} {period}"

            # Region logic
            region = 'ap-south-1'
            if city in ['Chennai', 'Bengaluru', 'Kochi', 'Coimbatore', 'Thiruvananthapuram']:
                region = 'ap-south-1'
            else:
                region = 'ap-south-2'

            h = Hospital(
                hospital_id=padded_id,
                name=name,
                city=city,
                status=status,
                last_data_received=last_data_received,
                expected_data_time='12:00 PM',
                delay_minutes=delay_minutes,
                data_frequency=30,
                data_volume_mb=data_volume_mb,
                records_received=records_received,
                service_status=service_status,
                data_quality=data_quality,
                aws_cost=aws_cost,
                ip_address=f"10.142.{(i * 3) % 255}.{(i * 7) % 255}",
                region=region,
                api_endpoint=f"https://{city.lower().replace(' ', '')}-node.live-ibhar.net/telemetry"
            )
            hospitals_to_create.append(h)

        Hospital.objects.bulk_create(hospitals_to_create)
        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(hospitals_to_create)} mock hospitals.'))

        # Generate some mock alerts
        self.stdout.write('Generating initial mock alerts...')
        mock_alerts = [
            {
                'hospital_id': 'HOSP000023',
                'hospital_name': 'Manipal Hospital, Pune',
                'type': 'critical',
                'title': 'Service Unavailable (Stopped)',
                'message': 'HL7 telemetry broker stopped transmitting. Ingestion latency exceeded 240 minutes.',
                'time': '4 hours ago',
                'last_received': '08:00 AM',
                'expected_time': '12:00 PM',
                'category': 'service'
            },
            {
                'hospital_id': 'HOSP000041',
                'hospital_name': 'Manipal Hospital, Coimbatore',
                'type': 'critical',
                'title': 'Telemetry Agent Offline',
                'message': 'Ingestion connector could not establish network handshake. Ingestion latency exceeded 310 minutes.',
                'time': '5 hours ago',
                'last_received': '07:00 AM',
                'expected_time': '12:00 PM',
                'category': 'service'
            },
            {
                'hospital_id': 'HOSP000012',
                'hospital_name': 'Max Super Speciality, Coimbatore',
                'type': 'warning',
                'title': 'High Data Ingestion Latency',
                'message': 'Transmission interval has delayed by 95 minutes, breaching the 30-minute threshold.',
                'time': '1 hour ago',
                'last_received': '10:30 AM',
                'expected_time': '12:00 PM',
                'category': 'delay'
            },
            {
                'hospital_id': 'HOSP000084',
                'hospital_name': 'Apollo Hospital, Thiruvananthapuram',
                'type': 'critical',
                'title': 'Transmission Quality Degraded',
                'message': 'Ingestion quality score dropped to 52%. Packet transmission validation check failed.',
                'time': '3 hours ago',
                'last_received': '09:00 AM',
                'expected_time': '12:00 PM',
                'category': 'quality'
            }
        ]

        alerts_to_create = []
        for alert_data in mock_alerts:
            hosp = Hospital.objects.filter(hospital_id=alert_data['hospital_id']).first()
            alerts_to_create.append(Alert(
                hospital=hosp,
                hospital_name=alert_data['hospital_name'],
                type=alert_data['type'],
                title=alert_data['title'],
                message=alert_data['message'],
                time=alert_data['time'],
                last_received=alert_data['last_received'],
                expected_time=alert_data['expected_time'],
                category=alert_data['category'],
                is_read=False
            ))
        
        Alert.objects.bulk_create(alerts_to_create)
        self.stdout.write(self.style.SUCCESS('Successfully created initial mock alerts.'))
