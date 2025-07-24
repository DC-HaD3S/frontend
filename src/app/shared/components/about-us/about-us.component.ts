import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css']
})
export class AboutUsComponent implements OnInit, OnDestroy {
  currentValueSlide: number = 0;
  currentTeamSlide: number = 0;
  isMobileView: boolean = false;

  values = [
    { 
      title: 'Accessibility', 
      description: 'We ensure education is available to everyone, anytime, anywhere, with courses designed for all learning levels.' 
    },
    { 
      title: 'Innovation', 
      description: 'Our platform leverages cutting-edge technology to deliver interactive and personalized learning experiences.' 
    },
    { 
      title: 'Community', 
      description: 'We foster a global community of learners and educators, encouraging collaboration and knowledge sharing.' 
    }
  ];

  team = [
    { 
      name: 'Rohit Zirmute', 
      role: 'Founder & CEO', 
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2PopevORe4gHj-LOC8Yk6ocovEwJMgyOn6w&s' 
    },
    { 
      name: 'Rohit Z', 
      role: 'Chief Learning Officer', 
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2PopevORe4gHj-LOC8Yk6ocovEwJMgyOn6w&s' 
    },
    { 
      name: 'Rohit', 
      role: 'Head of Technology', 
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2PopevORe4gHj-LOC8Yk6ocovEwJMgyOn6w&s' 
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkMobileView();
  }

  ngOnDestroy() {
    // Clean up any subscriptions if needed
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobileView();
  }

  private checkMobileView() {
    this.isMobileView = window.innerWidth <= 768;
  }

  prevSlide(type: 'values' | 'team') {
    if (type === 'values' && this.currentValueSlide > 0) {
      this.currentValueSlide--;
    } else if (type === 'team' && this.currentTeamSlide > 0) {
      this.currentTeamSlide--;
    }
  }

  nextSlide(type: 'values' | 'team') {
    if (type === 'values' && this.currentValueSlide < this.values.length - 1) {
      this.currentValueSlide++;
    } else if (type === 'team' && this.currentTeamSlide < this.team.length - 1) {
      this.currentTeamSlide++;
    }
  }

  goToSlide(type: 'values' | 'team', index: number) {
    if (type === 'values') {
      this.currentValueSlide = index;
    } else if (type === 'team') {
      this.currentTeamSlide = index;
    }
  }
}