import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularVanilla } from './angular-vanilla';

describe('AngularVanilla', () => {
  let component: AngularVanilla;
  let fixture: ComponentFixture<AngularVanilla>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularVanilla],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularVanilla);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
